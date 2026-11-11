// Sections 3.6 & 3.7: PRMS Reserves Categorisation (1P, 2P, 3P) and Method/Mechanism Recommendation

function sampleTriangular(minVal, modeVal, maxVal, u) {
  if (maxVal <= minVal) return modeVal
  const f = (modeVal - minVal) / (maxVal - minVal)
  if (u <= f) {
    return minVal + Math.sqrt(u * (maxVal - minVal) * (modeVal - minVal))
  }
  return maxVal - Math.sqrt((1 - u) * (maxVal - minVal) * (maxVal - modeVal))
}

// Deterministic pseudo-random generator for reproducible Monte Carlo P90, P50, P10
function createSeededRandom(seed = 1234567) {
  let state = seed
  return function nextRandom() {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

export function calcPRMSReserves({
  areaAcres,
  netPayFeet,
  porosity,
  initialWaterSat,
  bgiCuftScf,
  activeRf,
  trials = 2500,
}) {
  const A = Number(areaAcres) > 0 ? Number(areaAcres) : 640
  const h = Number(netPayFeet) > 0 ? Number(netPayFeet) : 45
  const phi = Number(porosity) > 0 ? Number(porosity) : 0.18
  const sw = Number(initialWaterSat) >= 0 ? Number(initialWaterSat) : 0.25
  const bgi = Number(bgiCuftScf) > 0 ? Number(bgiCuftScf) : 0.005
  const rf = Number(activeRf) > 0 ? Number(activeRf) : 0.75

  const rng = createSeededRandom(Math.round(A * 10 + h * 100 + phi * 1000))
  const samples = []

  for (let i = 0; i < trials; i++) {
    const aSample = sampleTriangular(A * 0.85, A, A * 1.18, rng())
    const hSample = sampleTriangular(h * 0.85, h, h * 1.18, rng())
    const phiSample = sampleTriangular(phi * 0.88, phi, phi * 1.14, rng())
    const swSample = sampleTriangular(Math.max(0.05, sw * 0.85), sw, Math.min(0.85, sw * 1.15), rng())
    const rfSample = sampleTriangular(Math.max(0.25, rf * 0.88), rf, Math.min(0.92, rf * 1.1), rng())

    const giipBscf = (43560 * aSample * hSample * phiSample * (1 - swSample)) / bgi / 1e9
    const recBscf = giipBscf * rfSample
    samples.push(recBscf)
  }

  samples.sort((a, b) => a - b)

  // P90 exceedance = 10th percentile of ascending array
  const p90Index = Math.floor(trials * 0.1)
  const p50Index = Math.floor(trials * 0.5)
  const p10Index = Math.floor(trials * 0.9)

  const reserve1P = samples[p90Index]
  const reserve2P = samples[p50Index]
  const reserve3P = samples[p10Index]

  // Generate exceedance probability curve (P95 down to P5)
  const probabilityCurve = []
  for (let pct = 5; pct <= 95; pct += 10) {
    const idx = Math.min(trials - 1, Math.floor((trials * (100 - pct)) / 100))
    probabilityCurve.push({
      exceedancePct: `P${pct}`,
      reservesBscf: Number(samples[idx].toFixed(2)),
    })
  }

  return {
    reserve1P: Number(reserve1P.toFixed(2)),
    reserve2P: Number(reserve2P.toFixed(2)),
    reserve3P: Number(reserve3P.toFixed(2)),
    probabilityCurve,
  }
}

export function recommendMethodAndMechanism({
  fluidType,
  driveMechanism,
  fieldStage = 'early',
}) {
  const isCondensate = fluidType === 'Gas Condensate'
  const isWaterDrive = driveMechanism === 'water_drive'

  let reservoirClass = 'Class I: Volumetric Dry / Wet Gas'
  let spreadDescription = 'Narrowest 1P to 3P uncertainty spread'

  if (!isCondensate && isWaterDrive) {
    reservoirClass = 'Class II: Water-Drive Dry / Wet Gas'
    spreadDescription = 'Wider spread due to aquifer encroachment and residual trapping'
  } else if (isCondensate && !isWaterDrive) {
    reservoirClass = 'Class III: Volumetric Gas-Condensate'
    spreadDescription = 'Wider spread due to retrograde condensate dropout below dew point'
  } else if (isCondensate && isWaterDrive) {
    reservoirClass = 'Class IV: Water-Drive Gas-Condensate'
    spreadDescription = 'Widest spread combining two-phase behavior and aquifer influx'
  }

  let recommendedMethod = 'Volumetric Method (Eq. 3.11)'
  let evidence = 'Static reservoir rock and fluid parameters provided; best suited for initial appraisal.'

  if (fieldStage === 'producing') {
    recommendedMethod = isWaterDrive
      ? 'Havlena-Odeh Material Balance with Aquifer Influx (Eq. 3.28)'
      : 'Linear P/Z Material Balance Method (Eq. 3.17)'
    evidence = isWaterDrive
      ? 'Active aquifer support bends P/Z upward; Havlena-Odeh F/(Eg+Efw) corrects apparent GIIP.'
      : 'Linear P/Z depletion trend with dominant gas expansion index (IDD near 1.0).'
  } else if (fieldStage === 'mature') {
    recommendedMethod = 'Arps Decline Curve Analysis (Eq. 3.66 - 3.80)'
    evidence = 'Boundary-dominated late-life production rate trend extrapolated to economic limit qa.'
  }

  return {
    reservoirClass,
    spreadDescription,
    recommendedMethod,
    evidence,
  }
}
