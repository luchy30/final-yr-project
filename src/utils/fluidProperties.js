// Section 3.1 & 3.2: Fluid Classification and Gas Property Calculations

export function classifyReservoirFluid({ gorScfStb, apiGravity, reservoirTempF, dewPointPsia, initialPressurePsia }) {
  const gor = Number(gorScfStb)
  const api = Number(apiGravity)
  const pDew = Number(dewPointPsia)
  const pi = Number(initialPressurePsia)

  if (pDew > 0 && pi >= pDew && gor >= 3000 && gor <= 70000) {
    return {
      fluidType: 'Gas Condensate',
      phaseRegime: 'Two-phase below dew point (retrograde condensation)',
      surfaceLiquid: 'Condensate (40 to 60 API)',
      gorBehavior: 'Rises below the dew point',
      requiresTwoPhaseZ: true,
    }
  }

  if (gor > 0 && gor < 15000) {
    return {
      fluidType: 'Gas Condensate',
      phaseRegime: 'Gas above dew point; liquid drops out below it',
      surfaceLiquid: 'Condensate (40 to 60 API)',
      gorBehavior: 'Rises below the dew point',
      requiresTwoPhaseZ: true,
    }
  }

  if (gor >= 15000 && gor <= 100000) {
    return {
      fluidType: 'Wet Gas',
      phaseRegime: 'Single-phase gas in reservoir throughout depletion',
      surfaceLiquid: api >= 50 ? 'Light water-white condensate' : 'Surface separator liquid',
      gorBehavior: 'Constant throughout depletion',
      requiresTwoPhaseZ: false,
    }
  }

  return {
    fluidType: 'Dry Gas',
    phaseRegime: 'Single-phase gas in reservoir and at surface',
    surfaceLiquid: 'None (negligible liquid yield)',
    gorBehavior: 'Not applicable (dry gas)',
    requiresTwoPhaseZ: false,
  }
}

// Section 3.2.1: Pseudo-critical and Pseudo-reduced Properties
export function calcPseudoCriticalProperties(gasGravity, method = 'chapter3') {
  const gg = Number(gasGravity) > 0 ? Number(gasGravity) : 0.65

  if (method === 'sutton') {
    const ppc = 756.8 - 131.0 * gg - 3.6 * gg * gg
    const tpc = 169.2 + 349.5 * gg - 74.0 * gg * gg
    return { ppc, tpc }
  }

  // Chapter 3 Section 3.2.1 linear correlation
  const tpc = 170.491 + 307.344 * gg
  const ppc = 709.604 - 58.718 * gg
  return { ppc, tpc }
}

export function calcPseudoReduced(pressurePsia, tempF, gasGravity, method = 'chapter3') {
  const p = Number(pressurePsia) > 0 ? Number(pressurePsia) : 14.7
  const tempR = Number(tempF) + 459.67
  const { ppc, tpc } = calcPseudoCriticalProperties(gasGravity, method)
  const ppr = ppc > 0 ? p / ppc : 1
  const tpr = tpc > 0 ? tempR / tpc : 1
  return { ppc, tpc, ppr, tpr, tempR }
}

// Section 3.2.1: Brill and Beggs Z-Factor Correlation (Equations 3.2 - 3.3)
export function calcBrillBeggsZ(ppr, tpr) {
  const safeTpr = Math.max(0.93, tpr)
  const A = 1.39 * Math.pow(safeTpr - 0.92, 0.5) - 0.36 * safeTpr - 0.10
  const E = 9 * (safeTpr - 1)
  const B =
    (0.62 - 0.23 * safeTpr) * ppr +
    (0.066 / (safeTpr - 0.86) - 0.037) * ppr * ppr +
    (0.32 * Math.pow(ppr, 6)) / Math.pow(10, E)
  const C = 0.132 - 0.32 * Math.log10(safeTpr)
  const F = 0.3106 - 0.49 * safeTpr + 0.1824 * safeTpr * safeTpr
  const D = Math.pow(10, F)

  const z = A + (1 - A) / Math.exp(B) + C * Math.pow(ppr, D)
  if (!Number.isFinite(z)) return 0.9
  return Math.max(0.3, Math.min(2.5, z))
}

// Section 3.2.1: Hall-Yarborough Iterative Z-Factor Correlation
export function calcHallYarboroughZ(ppr, tpr) {
  const t = tpr > 0 ? 1 / tpr : 1
  const X1 = -0.06125 * ppr * t * Math.exp(-1.2 * Math.pow(1 - t, 2))
  const X2 = 14.76 * t - 9.76 * t * t + 4.58 * t * t * t
  const X3 = 90.7 * t - 242.2 * t * t + 42.4 * t * t * t
  const X4 = 2.18 + 2.82 * t

  let y = 0.0125 * ppr * t * Math.exp(-1.2 * Math.pow(1 - t, 2))
  if (y <= 0) y = 0.001

  for (let iter = 0; iter < 30; iter++) {
    const oneMinusY = 1 - y
    const fy =
      X1 +
      (y + y * y + y * y * y - Math.pow(y, 4)) / Math.pow(oneMinusY, 3) -
      X2 * y * y +
      X3 * Math.pow(y, X4)
    const dfy =
      (1 + 4 * y + 4 * y * y - 4 * y * y * y + Math.pow(y, 4)) /
        Math.pow(oneMinusY, 4) -
      2 * X2 * y +
      X3 * X4 * Math.pow(y, X4 - 1)

    if (Math.abs(dfy) < 1e-12) break
    const nextY = y - fy / dfy
    if (Math.abs(nextY - y) < 1e-7) {
      y = nextY
      break
    }
    y = Math.max(1e-6, Math.min(0.95, nextY))
  }

  const z = y > 0 ? -X1 / y : 1
  if (!Number.isFinite(z)) return 0.9
  return Math.max(0.3, Math.min(2.5, z))
}

// Section 3.4.1: Dranchuk and Abou-Kassem (1975) 11-Constant Z-Factor Correlation
export function calcDranchukAbouKassemZ(ppr, tpr) {
  const A1 = 0.3265
  const A2 = -1.07
  const A3 = -0.5339
  const A4 = 0.01569
  const A5 = -0.05165
  const A6 = 0.5475
  const A7 = -0.7361
  const A8 = 0.1844
  const A9 = 0.1056
  const A10 = 0.6134
  const A11 = 0.721

  const safeTpr = Math.max(1.01, tpr)
  let rhor = (0.27 * ppr) / safeTpr

  const c1 =
    A1 +
    A2 / safeTpr +
    A3 / Math.pow(safeTpr, 3) +
    A4 / Math.pow(safeTpr, 4) +
    A5 / Math.pow(safeTpr, 5)
  const c2 = A6 + A7 / safeTpr + A8 / (safeTpr * safeTpr)
  const c3 = A9 * (A7 / safeTpr + A8 / (safeTpr * safeTpr))

  for (let iter = 0; iter < 30; iter++) {
    const r2 = rhor * rhor
    const r5 = Math.pow(rhor, 5)
    const expTerm = Math.exp(-A11 * r2)
    const zCalc =
      1 +
      c1 * rhor +
      c2 * r2 -
      c3 * r5 +
      A10 * (1 + A11 * r2) * (r2 / Math.pow(safeTpr, 3)) * expTerm

    const f = rhor - (0.27 * ppr) / (zCalc * safeTpr)
    const dzDrho =
      c1 +
      2 * c2 * rhor -
      5 * c3 * Math.pow(rhor, 4) +
      ((2 * A10 * rhor) / Math.pow(safeTpr, 3)) *
        expTerm *
        (1 + A11 * r2 - A11 * A11 * r2 * r2)

    const df = 1 + ((0.27 * ppr) / (safeTpr * zCalc * zCalc)) * dzDrho
    if (Math.abs(df) < 1e-12) break
    const nextRhor = rhor - f / df
    if (Math.abs(nextRhor - rhor) < 1e-7) {
      rhor = nextRhor
      break
    }
    rhor = Math.max(1e-5, Math.min(3.0, nextRhor))
  }

  const z = (0.27 * ppr) / (rhor * safeTpr)
  if (!Number.isFinite(z)) return 0.9
  return Math.max(0.3, Math.min(2.5, z))
}

// Section 3.2: Gas Formation Volume Factor Bg (Equations 3.1 and 3.2)
export function calcBg({ pressurePsia, tempR, zFactor }) {
  const p = Number(pressurePsia) > 0 ? Number(pressurePsia) : 14.7
  const t = Number(tempR) > 0 ? Number(tempR) : 520
  const z = Number(zFactor) > 0 ? Number(zFactor) : 1.0

  // Equation [3.1]: cuft/scf
  const bgCuftScf = (0.02827 * z * t) / p
  // Equation [3.2]: rb/scf
  const bgRbScf = (0.005035 * z * t) / p

  return { bgCuftScf, bgRbScf }
}

// Section 3.3: Wet Gas and Condensate Equivalent Properties
export function calcWetGasProperties({ gorScfStb, apiGravity, surfaceGasGravity, wellStreamGasInPlaceScf }) {
  const gor = Number(gorScfStb) > 0 ? Number(gorScfStb) : 50000
  const api = Number(apiGravity) > 10 ? Number(apiGravity) : 55
  const gg = Number(surfaceGasGravity) > 0 ? Number(surfaceGasGravity) : 0.65
  const gt = Number(wellStreamGasInPlaceScf) > 0 ? Number(wellStreamGasInPlaceScf) : 0

  const gammaO = 141.5 / (131.5 + api)
  const molecularWeightMo = 6084 / (api - 5.9)
  const gasEquivalentGE = (133000 * gammaO) / molecularWeightMo
  const wellStreamGravity = (gor * gg + 4602 * gammaO) / (gor + gasEquivalentGE)
  const dryGasFraction = gor / (gor + gasEquivalentGE)
  const surfaceGasInPlaceScf = dryGasFraction * gt
  const initialCondensateInPlaceStb = gt / (gor + gasEquivalentGE)

  return {
    gammaO,
    molecularWeightMo,
    gasEquivalentGE,
    wellStreamGravity,
    dryGasFraction,
    surfaceGasInPlaceScf,
    initialCondensateInPlaceStb,
  }
}
