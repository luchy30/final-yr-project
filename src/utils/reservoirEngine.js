import {
  classifyReservoirFluid,
  calcPseudoReduced,
  calcBrillBeggsZ,
  calcHallYarboroughZ,
  calcDranchukAbouKassemZ,
  calcBg,
  calcWetGasProperties,
} from './fluidProperties.js'
import { calcVolumetricReserves } from './volumetric.js'
import {
  calcAquiferProperties,
  calcMaterialBalanceAndDriveIndices,
} from './materialBalance.js'
import { calcArpsDecline, calcProductionForecast } from './declineCurve.js'
import {
  calcPRMSReserves,
  recommendMethodAndMechanism,
} from './reservesAndRecommendation.js'

export const DEFAULT_INPUTS = {
  area: '640',
  thickness: '45',
  porosity: '0.18',
  waterSat: '0.25',
  residualGasSat: '0.25',
  pressure: '3200',
  abandonmentPressure: '500',
  temperature: '180',
  gasGravity: '0.65',
  gor: '120000',
  apiGravity: '55',
  zMethod: 'hall_yarborough',
  pseudoMethod: 'chapter3',
  classificationCriterion: 'ahmed',
  driveMechanism: 'volumetric',
  aquiferModel: 'pot',
  declineModel: 'hyperbolic',
  fieldStage: 'producing',
  initialRate: '12000',
  declineRate: '0.025',
  arpsB: '0.5',
  economicLimit: '500',
}

export const PROJECT_TEMPLATES = {
  dry_gas: {
    label: 'Dry Gas Field (Default)',
    description: 'Volumetric or aquifer-supported dry gas reservoir evaluation.',
    inputs: { ...DEFAULT_INPUTS },
  },
  condensate: {
    label: 'Gas Condensate Field',
    description: 'High-pressure gas condensate appraisal with wellstream gravity adjustment.',
    inputs: {
      ...DEFAULT_INPUTS,
      area: '960',
      thickness: '65',
      porosity: '0.21',
      waterSat: '0.22',
      pressure: '4600',
      abandonmentPressure: '800',
      temperature: '215',
      gasGravity: '0.72',
      gor: '18500',
      apiGravity: '52',
      zMethod: 'dak',
      driveMechanism: 'water_drive',
      aquiferModel: 'schilthuis',
      fieldStage: 'early',
      initialRate: '18000',
      declineRate: '0.02',
      arpsB: '0.45',
      economicLimit: '750',
    },
  },
  mature_decline: {
    label: 'Mature Producing Field',
    description: 'Late-life field focused on Arps decline curve and depletion timeline.',
    inputs: {
      ...DEFAULT_INPUTS,
      area: '480',
      thickness: '38',
      porosity: '0.16',
      waterSat: '0.28',
      pressure: '1950',
      abandonmentPressure: '350',
      temperature: '165',
      gasGravity: '0.62',
      gor: '95000',
      apiGravity: '58',
      zMethod: 'brill_beggs',
      driveMechanism: 'volumetric',
      aquiferModel: 'pot',
      declineModel: 'hyperbolic',
      fieldStage: 'mature',
      initialRate: '7500',
      declineRate: '0.032',
      arpsB: '0.4',
      economicLimit: '400',
    },
  },
}

export const STARTER_PROJECTS = [
  {
    id: 'niger-delta-gas-sand-a',
    name: 'Niger Delta Gas Sand A',
    description:
      'Active depletion study with Pot and Schilthuis aquifer evaluation and Hall-Yarborough Z-factor modeling.',
    inputs: { ...PROJECT_TEMPLATES.dry_gas.inputs },
    activeChartTab: 'pz',
    createdAt: '2026-11-12T09:00:00.000Z',
    updatedAt: '2026-11-12T09:00:00.000Z',
  },
  {
    id: 'deep-offshore-condensate-b',
    name: 'Deep Offshore Condensate B',
    description:
      'Class IV water-drive gas condensate reservoir with Schilthuis aquifer support and condensate yield estimation.',
    inputs: { ...PROJECT_TEMPLATES.condensate.inputs },
    activeChartTab: 'pz',
    createdAt: '2026-11-12T09:05:00.000Z',
    updatedAt: '2026-11-12T09:05:00.000Z',
  },
  {
    id: 'mature-field-decline-c',
    name: 'Mature Field Decline C',
    description:
      'Late-life Arps hyperbolic production decline forecast and economic abandonment analysis.',
    inputs: { ...PROJECT_TEMPLATES.mature_decline.inputs },
    activeChartTab: 'dca',
    createdAt: '2026-11-12T09:10:00.000Z',
    updatedAt: '2026-11-12T09:10:00.000Z',
  },
]

export function normalizeInputs(rawInputs) {
  const merged = { ...DEFAULT_INPUTS, ...(rawInputs || {}) }
  if (merged.aquiferModel !== 'pot' && merged.aquiferModel !== 'schilthuis') {
    merged.aquiferModel = 'pot'
  }
  return merged
}

export function normalizeProject(raw) {
  const now = new Date().toISOString()
  return {
    id: raw.id,
    name: raw.name || 'Untitled Field',
    description: raw.description || '',
    inputs: normalizeInputs(raw.inputs),
    activeChartTab: raw.activeChartTab || raw.active_chart_tab || 'pz',
    createdAt: raw.createdAt || raw.created_at || now,
    updatedAt: raw.updatedAt || raw.updated_at || now,
  }
}

function parseNumeric(val, fallback, allowZero = false) {
  const parsed = parseFloat(val)
  if (!Number.isFinite(parsed)) return fallback
  if (allowZero ? parsed >= 0 : parsed > 0) return parsed
  return fallback
}

export function getZMethodLabel(selectedMethod) {
  if (selectedMethod === 'brill_beggs') {
    return 'Brill and Beggs'
  }
  if (selectedMethod === 'dak') {
    return 'Dranchuk and Abou-Kassem'
  }
  return 'Hall and Yarborough'
}

function computeZByMethod(pPsia, tempF, gg, selectedMethod, selectedPseudoMethod) {
  const { ppr, tpr } = calcPseudoReduced(pPsia, tempF, gg, selectedPseudoMethod)
  if (selectedMethod === 'brill_beggs') {
    return calcBrillBeggsZ(ppr, tpr)
  }
  if (selectedMethod === 'dak') {
    return calcDranchukAbouKassemZ(ppr, tpr)
  }
  return calcHallYarboroughZ(ppr, tpr)
}

export function computeCompleteResults(rawConfig) {
  const config = normalizeInputs(rawConfig)

  const a = parseNumeric(config.area, 640)
  const h = parseNumeric(config.thickness, 45)
  const phi = parseNumeric(config.porosity, 0.18)
  const swi = parseNumeric(config.waterSat, 0.25, true)
  const sgr = parseNumeric(config.residualGasSat, 0.25, true)
  const pi = parseNumeric(config.pressure, 3200)
  const pa = parseNumeric(config.abandonmentPressure, 500)
  const tempF = parseNumeric(config.temperature, 180)
  const gg = parseNumeric(config.gasGravity, 0.65)
  const gorVal = parseNumeric(config.gor, 120000)
  const apiVal = parseNumeric(config.apiGravity, 55)

  const activeZMethod = config.zMethod
  const activePseudoMethod = config.pseudoMethod
  const activeCriterion = config.classificationCriterion
  const activeDriveMechanism = config.driveMechanism
  const activeAquiferModel = config.aquiferModel
  const activeDeclineModel = config.declineModel
  const activeFieldStage = config.fieldStage

  const classification = classifyReservoirFluid({
    gorScfStb: gorVal,
    apiGravity: apiVal,
    reservoirTempF: tempF,
    dewPointPsia: 0,
    initialPressurePsia: pi,
    criterion: activeCriterion,
  })

  const prelimWetProps = calcWetGasProperties({
    gorScfStb: gorVal,
    apiGravity: apiVal,
    surfaceGasGravity: gg,
    wellStreamGasInPlaceScf: 0,
  })

  const effectiveGasGravity =
    classification.fluidType === 'Dry Gas'
      ? gg
      : prelimWetProps.wellStreamGravity

  const initialReduced = calcPseudoReduced(pi, tempF, effectiveGasGravity, activePseudoMethod)
  const abandonmentReduced = calcPseudoReduced(pa, tempF, effectiveGasGravity, activePseudoMethod)

  const zBrillBeggsInitial = calcBrillBeggsZ(initialReduced.ppr, initialReduced.tpr)
  const zHallYarboroughInitial = calcHallYarboroughZ(initialReduced.ppr, initialReduced.tpr)
  const zDakInitial = calcDranchukAbouKassemZ(initialReduced.ppr, initialReduced.tpr)

  const zi = computeZByMethod(pi, tempF, effectiveGasGravity, activeZMethod, activePseudoMethod)
  const za = computeZByMethod(pa, tempF, effectiveGasGravity, activeZMethod, activePseudoMethod)

  const { bgCuftScf: bgiCuft, bgRbScf: bgiRb } = calcBg({
    pressurePsia: pi,
    tempR: initialReduced.tempR,
    zFactor: zi,
  })
  const { bgCuftScf: bgaCuft } = calcBg({
    pressurePsia: pa,
    tempR: initialReduced.tempR,
    zFactor: za,
  })

  const volRes = calcVolumetricReserves({
    areaAcres: a,
    netPayFeet: h,
    porosity: phi,
    initialWaterSat: swi,
    residualGasSat: sgr,
    initialPressurePsia: pi,
    initialZ: zi,
    bgiCuftScf: bgiCuft,
    abandonmentPressurePsia: pa,
    abandonmentZ: za,
    bgaCuftScf: bgaCuft,
    cumulativeGasProducedBscf: 0,
    driveMechanism: activeDriveMechanism,
  })

  const wetProps = calcWetGasProperties({
    gorScfStb: gorVal,
    apiGravity: apiVal,
    surfaceGasGravity: gg,
    wellStreamGasInPlaceScf: volRes.giipScf,
  })

  const reFt = Math.sqrt((a * 43560) / Math.PI)
  const aquiferProps = calcAquiferProperties({
    reservoirRadiusFt: reFt,
    aquiferRadiusFt: reFt * 5,
    netPayFeet: h,
    porosity: phi,
    initialPressurePsia: pi,
  })

  const mbeRes = calcMaterialBalanceAndDriveIndices({
    giipScf: volRes.giipScf,
    initialPressurePsia: pi,
    abandonmentPressurePsia: pa,
    tempF,
    gasGravity: effectiveGasGravity,
    initialWaterSat: swi,
    residualGasSat: sgr,
    aquiferModel: activeAquiferModel,
    driveMechanism: activeDriveMechanism,
    calcZFunc: (pVal) =>
      computeZByMethod(pVal, tempF, effectiveGasGravity, activeZMethod, activePseudoMethod),
    calcBgFunc: (pVal, zVal) =>
      calcBg({ pressurePsia: pVal, tempR: initialReduced.tempR, zFactor: zVal }),
    aquiferProps,
  })

  const qInit = parseNumeric(config.initialRate, 12000)
  const dNom = parseNumeric(config.declineRate, 0.025)
  const bExp = parseNumeric(config.arpsB, 0.5)
  const qAband = parseNumeric(config.economicLimit, 500)

  const dcaRes = calcArpsDecline({
    initialRateMscfDay: qInit,
    nominalDeclinePerMonth: dNom,
    hyperbolicExponentB: bExp,
    economicLimitMscfDay: qAband,
    activeModel: activeDeclineModel,
  })

  const recommendation = recommendMethodAndMechanism({
    fluidType: classification.fluidType,
    driveMechanism: activeDriveMechanism,
    fieldStage: activeFieldStage,
    volumetricEurBscf: volRes.ultimateRecoveryBscf,
    mbeEurBscf: mbeRes.mbeEurBscf,
    dcaEurBscf: dcaRes.activeEurBscf,
    IDD: mbeRes.IDD,
    ICD: mbeRes.ICD,
    IWD: mbeRes.IWD,
    zMethodLabel: getZMethodLabel(activeZMethod),
    effectiveGasGravity,
  })

  const forecastRes = calcProductionForecast({
    estimatedRecoverableBscf: recommendation.finalRecommendedEurBscf,
    giipBscf: volRes.giipBscf,
    initialRateMscfDay: qInit,
    economicLimitMscfDay: qAband,
    hyperbolicExponentB: bExp,
    declineModel: activeDeclineModel,
  })

  const prmsRes = calcPRMSReserves({
    areaAcres: a,
    netPayFeet: h,
    porosity: phi,
    initialWaterSat: swi,
    bgiCuftScf: bgiCuft,
    activeRf: volRes.activeRf,
    baseTargetEurBscf: recommendation.finalRecommendedEurBscf,
    uncertaintySpread: recommendation.uncertaintySpread,
    trials: 2500,
  })

  const zCurve = []
  const pSteps = 10
  const deltaP = (pi - pa) / pSteps
  for (let i = 0; i <= pSteps; i++) {
    const pCurrent = pa + i * deltaP
    const { ppr: pprCurr, tpr: tprCurr } = calcPseudoReduced(
      pCurrent,
      tempF,
      effectiveGasGravity,
      activePseudoMethod
    )
    zCurve.push({
      pressure: Math.round(pCurrent),
      hallYarborough: parseFloat(calcHallYarboroughZ(pprCurr, tprCurr).toFixed(4)),
      brillBeggs: parseFloat(calcBrillBeggsZ(pprCurr, tprCurr).toFixed(4)),
      dak: parseFloat(calcDranchukAbouKassemZ(pprCurr, tprCurr).toFixed(4)),
    })
  }

  const matrixStages = [
    Math.round(pa),
    Math.round(pa + (pi - pa) * 0.33),
    Math.round(pa + (pi - pa) * 0.66),
    Math.round(pi),
  ]

  const correlationMatrix = [
    {
      name: 'Hall and Yarborough',
      key: 'hall_yarborough',
      values: matrixStages.map((pVal) => {
        const { ppr: prVal, tpr: trVal } = calcPseudoReduced(
          pVal,
          tempF,
          effectiveGasGravity,
          activePseudoMethod
        )
        return calcHallYarboroughZ(prVal, trVal).toFixed(4)
      }),
    },
    {
      name: 'Brill and Beggs',
      key: 'brill_beggs',
      values: matrixStages.map((pVal) => {
        const { ppr: prVal, tpr: trVal } = calcPseudoReduced(
          pVal,
          tempF,
          effectiveGasGravity,
          activePseudoMethod
        )
        return calcBrillBeggsZ(prVal, trVal).toFixed(4)
      }),
    },
    {
      name: 'Dranchuk and Abou-Kassem',
      key: 'dak',
      values: matrixStages.map((pVal) => {
        const { ppr: prVal, tpr: trVal } = calcPseudoReduced(
          pVal,
          tempF,
          effectiveGasGravity,
          activePseudoMethod
        )
        return calcDranchukAbouKassemZ(prVal, trVal).toFixed(4)
      }),
    },
  ]

  return {
    classification,
    prelimWetProps,
    wetProps,
    effectiveGasGravity: effectiveGasGravity.toFixed(3),
    initialReduced,
    abandonmentReduced,
    zBrillBeggsInitial: zBrillBeggsInitial.toFixed(4),
    zHallYarboroughInitial: zHallYarboroughInitial.toFixed(4),
    zDakInitial: zDakInitial.toFixed(4),
    zi: zi.toFixed(4),
    za: za.toFixed(4),
    bgiCuft: bgiCuft.toFixed(5),
    bgaCuft: bgaCuft.toFixed(5),
    bgiRb: bgiRb.toFixed(5),
    volRes,
    aquiferRes: aquiferProps,
    mbeRes,
    dcaRes,
    forecastRes,
    prmsRes,
    recommendation,
    zCurve,
    pressureStages: matrixStages,
    correlationMatrix,
    activeZMethod,
    activePseudoMethod,
    activeDriveMechanism,
    activeAquiferModel,
    activeDeclineModel,
    activeFieldStage,
  }
}
