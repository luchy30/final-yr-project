// Sections 3.5, 3.6, and 3.7: Material Balance, Water Influx, and Drive Indices

// van Everdingen-Hurst dimensionless water influx WD(tD) polynomial approximation
export function calcVEHDimensionlessInflux(tD) {
  if (tD <= 0) return 0
  if (tD < 0.01) {
    return 2 * Math.sqrt(tD / Math.PI)
  }
  if (tD <= 200) {
    const sqrtTd = Math.sqrt(tD)
    const num =
      1.2838 * sqrtTd +
      1.19328 * tD +
      0.269872 * tD * sqrtTd +
      0.00855294 * tD * tD
    const den = 1 + 0.616599 * sqrtTd + 0.0413008 * tD
    return num / den
  }
  return (-4.29881 + 2.02566 * tD) / Math.log(tD)
}

// Section 3.6.2: Water Influx Models (Pot, Schilthuis, Fetkovich, van Everdingen-Hurst, Carter-Tracy)
export function calcAquiferProperties({
  reservoirRadiusFt = 2980,
  aquiferRadiusFt = 15000,
  netPayFeet = 45,
  porosity = 0.18,
  waterCompressibilityPsi = 3e-6,
  rockCompressibilityPsi = 4e-6,
  encroachmentAngleDeg = 180,
  permeabilityMd = 50,
  waterViscosityCp = 0.5,
  initialPressurePsia = 3200,
}) {
  const re = Number(reservoirRadiusFt) > 0 ? Number(reservoirRadiusFt) : 2980
  const ra = Number(aquiferRadiusFt) > re ? Number(aquiferRadiusFt) : re * 5
  const h = Number(netPayFeet) > 0 ? Number(netPayFeet) : 45
  const phi = Number(porosity) > 0 ? Number(porosity) : 0.18
  const cw = Number(waterCompressibilityPsi) > 0 ? Number(waterCompressibilityPsi) : 3e-6
  const cf = Number(rockCompressibilityPsi) > 0 ? Number(rockCompressibilityPsi) : 4e-6
  const theta = Number(encroachmentAngleDeg) > 0 ? Number(encroachmentAngleDeg) : 180
  const k = Number(permeabilityMd) > 0 ? Number(permeabilityMd) : 50
  const muw = Number(waterViscosityCp) > 0 ? Number(waterViscosityCp) : 0.5
  const pi = Number(initialPressurePsia) > 0 ? Number(initialPressurePsia) : 3200

  // Equation (3.32) & (3.33)
  const f = theta / 360
  const ct = cw + cf

  // Equation (3.34): Initial volume of water in aquifer Wi (bbl)
  const Wi = (Math.PI * (ra * ra - re * re) * h * phi) / 5.615

  // Equation (3.38): Schilthuis steady-state aquifer constant C (bbl/day/psi)
  const lnRaRe = Math.log(ra / re)
  const schilthuisC = lnRaRe > 0 ? (0.00708 * k * h * f) / (muw * lnRaRe) : 0

  // Equation (3.41): van Everdingen-Hurst water influx constant B (bbl/psi)
  const vehB = 1.119 * phi * ct * re * re * h * f

  // Equation (3.43): Fetkovich maximum encroachable water Wei (bbl)
  const fetkovichWei = ct * Wi * pi * f

  // Equation (3.48): Fetkovich radial productivity index J (bbl/day/psi)
  const denomJ = Math.max(0.1, lnRaRe - 0.75)
  const fetkovichJ = (0.00708 * k * h * f) / (muw * denomJ)

  return {
    f,
    ct,
    Wi,
    schilthuisC,
    vehB,
    fetkovichWei,
    fetkovichJ,
    re,
    ra,
    k,
    muw,
    phi,
  }
}

export function calcWaterInfluxStep({
  model = 'fetkovich',
  aquiferProps,
  initialPressurePsia,
  currentPressurePsia,
  prevPressurePsia,
  prevAquiferPressurePsia,
  prevWeBbl = 0,
  deltaTimeDays = 180,
  totalTimeDays = 180,
}) {
  const pi = Number(initialPressurePsia)
  const p = Number(currentPressurePsia)
  const pPrev = Number(prevPressurePsia)
  const pBar = (pPrev + p) / 2
  const deltaP = Math.max(0, pi - p)

  if (model === 'pot') {
    // Equation (3.35)
    const we = aquiferProps.ct * aquiferProps.Wi * aquiferProps.f * deltaP
    return { weBbl: we, nextAquiferPressure: p }
  }

  if (model === 'schilthuis') {
    // Equation (3.37)
    const stepWe = aquiferProps.schilthuisC * Math.max(0, pi - pBar) * deltaTimeDays
    return { weBbl: prevWeBbl + stepWe, nextAquiferPressure: pi }
  }

  if (model === 'veh') {
    // Equation (3.42) & (3.40) single-step approximation
    const tD =
      (0.00633 * aquiferProps.k * totalTimeDays) /
      (aquiferProps.phi * aquiferProps.muw * aquiferProps.ct * aquiferProps.re * aquiferProps.re)
    const wD = calcVEHDimensionlessInflux(tD)
    const we = aquiferProps.vehB * (deltaP / 2) * wD
    return { weBbl: we, nextAquiferPressure: pi }
  }

  if (model === 'carter_tracy') {
    // Equations (3.50) & (3.51)
    const tD = Math.max(
      1.0,
      (0.00633 * aquiferProps.k * totalTimeDays) /
        (aquiferProps.phi * aquiferProps.muw * aquiferProps.ct * aquiferProps.re * aquiferProps.re)
    )
    const pD = 0.5 * (Math.log(tD) + 0.80907)
    const pDPrime = 1 / (2 * tD)
    const dtD = tD / 6
    const num = aquiferProps.vehB * deltaP - prevWeBbl * pDPrime
    const den = pD - (tD - dtD) * pDPrime
    const we = den > 0 ? prevWeBbl + dtD * (num / den) : prevWeBbl
    return { weBbl: Math.max(0, we), nextAquiferPressure: pi }
  }

  // Default: Fetkovich finite aquifer model - Equations (3.45) to (3.47)
  const wei = aquiferProps.fetkovichWei
  const J = aquiferProps.fetkovichJ
  if (wei <= 0) {
    return { weBbl: 0, nextAquiferPressure: pi }
  }
  if (pi <= 0) {
    return { weBbl: 0, nextAquiferPressure: pi }
  }
  const paPrev = prevAquiferPressurePsia > 0 ? prevAquiferPressurePsia : pi
  const expFactor = 1 - Math.exp((-J * pi * deltaTimeDays) / wei)
  const deltaWe = (wei / pi) * Math.max(0, paPrev - pBar) * expFactor
  const nextWe = prevWeBbl + deltaWe
  const nextPa = pi * (1 - nextWe / wei)
  return { weBbl: Math.max(0, nextWe), nextAquiferPressure: Math.max(p, nextPa) }
}

// Section 3.5.4 & 3.7: Havlena-Odeh Material Balance, P/Z Curves, Cole Plot, and Drive Indices
export function calcMaterialBalanceAndDriveIndices({
  giipScf,
  initialPressurePsia,
  abandonmentPressurePsia,
  tempF,
  gasGravity,
  initialWaterSat,
  waterCompressibilityPsi = 3e-6,
  rockCompressibilityPsi = 4e-6,
  aquiferModel = 'fetkovich',
  driveMechanism = 'volumetric',
  calcZFunc,
  calcBgFunc,
  aquiferProps,
}) {
  const G = Number(giipScf) > 0 ? Number(giipScf) : 50e9
  const pi = Number(initialPressurePsia) > 0 ? Number(initialPressurePsia) : 3200
  const pa = Number(abandonmentPressurePsia) > 0 ? Number(abandonmentPressurePsia) : 500
  const swi = Number(initialWaterSat) >= 0 ? Number(initialWaterSat) : 0.25
  const cw = Number(waterCompressibilityPsi) > 0 ? Number(waterCompressibilityPsi) : 3e-6
  const cf = Number(rockCompressibilityPsi) > 0 ? Number(rockCompressibilityPsi) : 4e-6

  // Equation (3.20): Effective compressibility Ce
  const Ce = 1 - swi > 0 ? (cw * swi + cf) / (1 - swi) : 0

  const zi = calcZFunc(pi)
  const { bgRbScf: bgiRb } = calcBgFunc(pi, zi)
  const piOverZi = zi > 0 ? pi / zi : pi

  const steps = 6
  const pzComparisonCurve = []
  const havlenaOdehPoints = []
  let weBbl = 0
  let paqPrev = pi
  let pPrev = pi

  let latestIDD = 1.0
  let latestICD = 0.0
  let latestIWD = 0.0

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps
    const pCurr = pi - frac * (pi - pa)
    const deltaP = pi - pCurr
    const zCurr = calcZFunc(pCurr)
    const { bgRbScf: bgRb } = calcBgFunc(pCurr, zCurr)

    // Equation (3.24) & (3.25)
    const Eg = Math.max(0, bgRb - bgiRb)
    const Efw = bgiRb * Ce * deltaP

    // Step water influx
    if (i > 0) {
      const influxStep = calcWaterInfluxStep({
        model: aquiferModel,
        aquiferProps,
        initialPressurePsia: pi,
        currentPressurePsia: pCurr,
        prevPressurePsia: pPrev,
        prevAquiferPressurePsia: paqPrev,
        prevWeBbl: weBbl,
        deltaTimeDays: 180,
        totalTimeDays: i * 180,
      })
      weBbl = influxStep.weBbl
      paqPrev = influxStep.nextAquiferPressure
    }
    pPrev = pCurr

    const activeWe = driveMechanism === 'water_drive' ? weBbl : 0

    // Volumetric Gp at this P/Z (Equation 3.17)
    const pzVal = zCurr > 0 ? pCurr / zCurr : 0
    const gpVolumetricBscf = (G * (1 - pzVal / piOverZi)) / 1e9

    // Material Balance with water influx and rock/water expansion (Equation 3.21)
    const totalProducedRb = G * (Eg + Efw) + activeWe
    const gpActualScf = bgRb > 0 ? totalProducedRb / bgRb : 0

    // Equation (3.30): P/Z under water drive at the same Gp fraction
    const waterDrivePz =
      piOverZi *
      Math.min(
        1.0,
        1 - Math.max(0, gpVolumetricBscf * 1e9 - activeWe / bgRb) / G
      )

    pzComparisonCurve.push({
      gp: Number(Math.max(0, gpVolumetricBscf).toFixed(2)),
      volumetricPz: Number(pzVal.toFixed(1)),
      waterDrivePz: Number(waterDrivePz.toFixed(1)),
    })

    if (i > 0 && Eg > 0) {
      // Equation (3.23): F = Gp * Bg + Wp * Bw
      const F = gpActualScf * bgRb
      // Equation (3.52): Apparent GIIP (Cole plot F/Eg)
      const gApparentBscf = F / Eg / 1e9
      const fOverEt = F / (Eg + Efw) / 1e9
      const weOverEt = activeWe / (Eg + Efw) / 1e9

      havlenaOdehPoints.push({
        step: i,
        gpBscf: Number((gpActualScf / 1e9).toFixed(2)),
        coleApparentGBscf: Number(gApparentBscf.toFixed(2)),
        fOverEtBscf: Number(fOverEt.toFixed(2)),
        weOverEtBscf: Number(weOverEt.toFixed(2)),
      })

      // Section 3.7 Equations (3.54) to (3.57): Drive Indices at current step
      if (F > 0) {
        latestIDD = (G * Eg) / F
        latestICD = (G * Efw) / F
        latestIWD = activeWe / F
      }
    }
  }

  const driveSum = latestIDD + latestICD + latestIWD

  // Final abandonment step values for Material Balance GIIP and EUR
  const lastPoint =
    havlenaOdehPoints.length > 0
      ? havlenaOdehPoints[havlenaOdehPoints.length - 1]
      : { gpBscf: 0, coleApparentGBscf: G / 1e9, fOverEtBscf: G / 1e9, weOverEtBscf: 0 }

  // Havlena-Odeh corrected GIIP: (F - We) / (Eg + Efw)
  const mbeGiipBscf = Math.max(0, lastPoint.fOverEtBscf - lastPoint.weOverEtBscf)
  const apparentColeGiipBscf = lastPoint.coleApparentGBscf

  // Material Balance EUR at abandonment accounting for rock/water expansion and aquifer sweep trapping
  const za = calcZFunc(pa)
  const { bgRbScf: bgaRb } = calcBgFunc(pa, za)
  const ega = Math.max(0, bgaRb - bgiRb)
  const efwa = bgiRb * Ce * Math.max(0, pi - pa)
  const baseMbeRecBscf = bgaRb > 0 ? (G * (ega + efwa)) / bgaRb / 1e9 : 0
  const activeWeFinal = driveMechanism === 'water_drive' ? weBbl : 0
  const trappedByWaterScf = bgaRb > 0 ? (activeWeFinal * 0.25) / bgaRb : 0
  const mbeEurBscf = Math.max(0, baseMbeRecBscf - trappedByWaterScf / 1e9)

  return {
    Ce,
    cumulativeWeBbl: weBbl,
    IDD: latestIDD,
    ICD: latestICD,
    IWD: latestIWD,
    driveSum,
    mbeGiipBscf,
    apparentColeGiipBscf,
    mbeEurBscf,
    pzComparisonCurve,
    havlenaOdehPoints,
  }
}
