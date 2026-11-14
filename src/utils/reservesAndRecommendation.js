// PRMS Reserves Categorisation (1P, 2P, 3P), Method Recommendation, and Reserves Reconciliation

function sampleTriangular(minVal, modeVal, maxVal, u) {
  if (maxVal <= minVal) return modeVal
  const f = (modeVal - minVal) / (maxVal - minVal)
  if (u <= f) {
    return minVal + Math.sqrt(u * (maxVal - minVal) * (modeVal - minVal))
  }
  return maxVal - Math.sqrt((1 - u) * (maxVal - minVal) * (maxVal - modeVal))
}

function createSeededRandom(seed = 1234567) {
  let state = seed
  return function nextRandom() {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

export function recommendMethodAndMechanism({
  fluidType,
  driveMechanism,
  fieldStage = 'early',
  volumetricEurBscf = 0,
  mbeEurBscf = 0,
  dcaEurBscf = 0,
  IDD = 1,
  ICD = 0,
  IWD = 0,
  zMethodLabel = 'Hall and Yarborough',
  effectiveGasGravity = 0.65,
}) {
  const isCondensate = fluidType === 'Gas Condensate'
  let isWaterDrive = driveMechanism === 'water_drive' || driveMechanism === 'combination'
  if (IWD > 0.15) {
    isWaterDrive = true
  }

  let reservoirClass = 'Class I: Volumetric Dry and Wet Gas'
  let spreadDescription = 'Narrowest 1P to 3P uncertainty spread'
  let uncertaintySpread = 0.14

  if (!isCondensate && isWaterDrive) {
    reservoirClass = 'Class II: Water-Drive Dry and Wet Gas'
    spreadDescription = 'Wider spread due to aquifer encroachment and residual trapping'
    uncertaintySpread = 0.20
  } else if (isCondensate && !isWaterDrive) {
    reservoirClass = 'Class III: Volumetric Gas-Condensate'
    spreadDescription = 'Wider spread due to retrograde condensate dropout below dew point'
    uncertaintySpread = 0.22
  } else if (isCondensate && isWaterDrive) {
    reservoirClass = 'Class IV: Water-Drive Gas-Condensate'
    spreadDescription = 'Widest spread combining two-phase behavior and aquifer influx'
    uncertaintySpread = 0.28
  }

  let dominantDrive = `Depletion Drive (IDD = ${IDD.toFixed(2)})`
  if (IWD >= IDD && IWD >= ICD) {
    dominantDrive = `Water Drive (IWD = ${IWD.toFixed(2)})`
  } else if (ICD > IDD && ICD > IWD) {
    dominantDrive = `Compaction Drive (ICD = ${ICD.toFixed(2)})`
  } else if (IWD > 0.1) {
    dominantDrive = `Combination Depletion and Water Drive (IDD = ${IDD.toFixed(2)}, IWD = ${IWD.toFixed(2)})`
  }

  const volEur = Number(volumetricEurBscf) > 0 ? Number(volumetricEurBscf) : 0
  const mbeEur = Number(mbeEurBscf) > 0 ? Number(mbeEurBscf) : volEur
  const dcaEur = Number(dcaEurBscf) > 0 ? Number(dcaEurBscf) : volEur

  let recommendedMethod = 'Volumetric Method'
  let finalRecommendedEurBscf = volEur
  let reconciledWeightedEurBscf = volEur * 0.6 + mbeEur * 0.3 + dcaEur * 0.1
  let confidence = 'Moderate (Appraisal Volumetric)'
  let stageExplanation =
    'Field is in early appraisal, so Volumetric EUR serves as the primary tied reserves figure.'

  if (fieldStage === 'producing') {
    recommendedMethod = isWaterDrive
      ? 'Havlena-Odeh Material Balance with Aquifer Influx'
      : 'Linear P/Z Material Balance Method'
    finalRecommendedEurBscf = mbeEur
    reconciledWeightedEurBscf = mbeEur * 0.55 + volEur * 0.3 + dcaEur * 0.15
    confidence = 'High (Material Balance Matched)'
    stageExplanation = isWaterDrive
      ? 'Active aquifer support bends P/Z upward, so Havlena-Odeh Material Balance EUR is selected as the primary tied reserves figure.'
      : 'Active pressure and production history with dominant gas expansion makes Linear P/Z Material Balance EUR the primary tied reserves figure.'
  } else if (fieldStage === 'mature') {
    recommendedMethod = 'Arps Decline Curve Analysis'
    finalRecommendedEurBscf = dcaEur
    reconciledWeightedEurBscf = dcaEur * 0.55 + mbeEur * 0.3 + volEur * 0.15
    confidence = 'High (Decline Curve History)'
    stageExplanation =
      'Boundary-dominated late-life production trend makes Arps Decline Curve EUR the primary tied reserves figure.'
  }

  const evidence = `Classified as ${fluidType} (${reservoirClass}) with effective well-stream gravity ${Number(effectiveGasGravity).toFixed(4)} feeding the ${zMethodLabel} Z-factor correlation. ${stageExplanation}`

  return {
    reservoirClass,
    spreadDescription,
    uncertaintySpread,
    dominantDrive,
    recommendedMethod,
    confidence,
    finalRecommendedEurBscf: Number(finalRecommendedEurBscf.toFixed(2)),
    reconciledWeightedEurBscf: Number(reconciledWeightedEurBscf.toFixed(2)),
    volumetricEurBscf: Number(volEur.toFixed(2)),
    mbeEurBscf: Number(mbeEur.toFixed(2)),
    dcaEurBscf: Number(dcaEur.toFixed(2)),
    evidence,
  }
}

export function calcPRMSReserves({
  areaAcres,
  netPayFeet,
  porosity,
  initialWaterSat,
  bgiCuftScf,
  activeRf,
  baseTargetEurBscf = 0,
  uncertaintySpread = 0.16,
  trials = 2500,
}) {
  const A = Number(areaAcres) > 0 ? Number(areaAcres) : 640
  const h = Number(netPayFeet) > 0 ? Number(netPayFeet) : 45
  const phi = Number(porosity) > 0 ? Number(porosity) : 0.18
  const sw = Number(initialWaterSat) >= 0 ? Number(initialWaterSat) : 0.25
  const bgi = Number(bgiCuftScf) > 0 ? Number(bgiCuftScf) : 0.005
  const rf = Number(activeRf) > 0 ? Number(activeRf) : 0.75
  const spread = Number(uncertaintySpread) > 0 ? Number(uncertaintySpread) : 0.16

  const baseVolEur = ((43560 * A * h * phi * (1 - sw)) / bgi / 1e9) * rf
  const scaleFactor =
    Number(baseTargetEurBscf) > 0 && baseVolEur > 0
      ? Number(baseTargetEurBscf) / baseVolEur
      : 1.0

  const rng = createSeededRandom(Math.round(A * 10 + h * 100 + phi * 1000))
  const samples = []

  for (let i = 0; i < trials; i++) {
    const aSample = sampleTriangular(A * (1 - spread), A, A * (1 + spread * 1.15), rng())
    const hSample = sampleTriangular(h * (1 - spread), h, h * (1 + spread * 1.15), rng())
    const phiSample = sampleTriangular(phi * (1 - spread * 0.75), phi, phi * (1 + spread * 0.85), rng())
    const swSample = sampleTriangular(
      Math.max(0.05, sw * (1 - spread * 0.8)),
      sw,
      Math.min(0.85, sw * (1 + spread * 0.8)),
      rng()
    )
    const rfSample = sampleTriangular(
      Math.max(0.2, rf * (1 - spread * 0.7)),
      rf,
      Math.min(0.94, rf * (1 + spread * 0.65)),
      rng()
    )

    const giipBscf = (43560 * aSample * hSample * phiSample * (1 - swSample)) / bgi / 1e9
    const recBscf = giipBscf * rfSample * scaleFactor
    samples.push(recBscf)
  }

  samples.sort((a, b) => a - b)

  const p90Index = Math.floor(trials * 0.1)
  const p50Index = Math.floor(trials * 0.5)
  const p10Index = Math.floor(trials * 0.9)

  const reserve1P = samples[p90Index]
  const reserve2P = samples[p50Index]
  const reserve3P = samples[p10Index]

  const probabilityCurve = []
  for (let pct = 5; pct <= 95; pct += 10) {
    const idx = Math.min(trials - 1, Math.floor((trials * (100 - pct)) / 100))
    probabilityCurve.push({
      exceedancePct: `P${pct}`,
      reservesBscf: Number(samples[idx].toFixed(2)),
    })
  }

  const r1P = Number(reserve1P.toFixed(2))
  const r2P = Number(reserve2P.toFixed(2))
  const r3P = Number(reserve3P.toFixed(2))
  const probableIncrementalBscf = Number(Math.max(0, r2P - r1P).toFixed(2))
  const possibleIncrementalBscf = Number(Math.max(0, r3P - r2P).toFixed(2))
  const uncertaintySpanBscf = Number(Math.max(0, r3P - r1P).toFixed(2))

  return {
    reserve1P: r1P,
    reserve2P: r2P,
    reserve3P: r3P,
    probableIncrementalBscf,
    possibleIncrementalBscf,
    uncertaintySpanBscf,
    probabilityCurve,
  }
}
