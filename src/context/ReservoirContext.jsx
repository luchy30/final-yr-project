import { createContext, useContext, useState, useMemo } from 'react'
import {
  classifyReservoirFluid,
  calcPseudoReduced,
  calcBrillBeggsZ,
  calcHallYarboroughZ,
  calcDranchukAbouKassemZ,
  calcBg,
  calcWetGasProperties,
} from '../utils/fluidProperties'
import { calcVolumetricReserves } from '../utils/volumetric'
import {
  calcAquiferProperties,
  calcMaterialBalanceAndDriveIndices,
} from '../utils/materialBalance'
import { calcArpsDecline } from '../utils/declineCurve'
import {
  calcPRMSReserves,
  recommendMethodAndMechanism,
} from '../utils/reservesAndRecommendation'

const ReservoirContext = createContext(null)

export function ReservoirProvider({ children }) {
  // Theme state: light or dark
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    if (saved) {
      return saved
    }
    return 'light'
  })

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
  }

  // Sidebar collapsed state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Search input query
  const [searchQuery, setSearchQuery] = useState('')

  // Chart selection tab
  const [activeChartTab, setActiveChartTab] = useState('pz')

  // Reservoir and Petrophysical Inputs
  const [area, setArea] = useState('640')
  const [thickness, setThickness] = useState('45')
  const [porosity, setPorosity] = useState('0.18')
  const [waterSat, setWaterSat] = useState('0.25')
  const [residualGasSat, setResidualGasSat] = useState('0.25')

  // Fluid and Pressure Inputs
  const [pressure, setPressure] = useState('3200')
  const [abandonmentPressure, setAbandonmentPressure] = useState('500')
  const [temperature, setTemperature] = useState('180')
  const [gasGravity, setGasGravity] = useState('0.65')
  const [gor, setGor] = useState('120000')
  const [apiGravity, setApiGravity] = useState('55')

  // Correlation Choices (Matching Chapter 3 Methodology)
  const [zMethod, setZMethod] = useState('hall_yarborough')
  const [pseudoMethod, setPseudoMethod] = useState('chapter3')
  const [classificationCriterion, setClassificationCriterion] = useState('ahmed')

  // Drive Mechanism, Aquifer and Decline Inputs
  const [driveMechanism, setDriveMechanism] = useState('volumetric')
  const [aquiferModel, setAquiferModel] = useState('pot')
  const [declineModel, setDeclineModel] = useState('hyperbolic')
  const [fieldStage, setFieldStage] = useState('producing')
  const [initialRate, setInitialRate] = useState('12000')
  const [declineRate, setDeclineRate] = useState('0.025')
  const [arpsB, setArpsB] = useState('0.5')
  const [economicLimit, setEconomicLimit] = useState('500')

  const computeZByMethod = (pPsia, tempF, gg, selectedMethod, selectedPseudoMethod) => {
    const { ppr, tpr } = calcPseudoReduced(pPsia, tempF, gg, selectedPseudoMethod)
    if (selectedMethod === 'brill_beggs') {
      return calcBrillBeggsZ(ppr, tpr)
    }
    if (selectedMethod === 'dak') {
      return calcDranchukAbouKassemZ(ppr, tpr)
    }
    return calcHallYarboroughZ(ppr, tpr)
  }

  const getZMethodLabel = (selectedMethod) => {
    if (selectedMethod === 'brill_beggs') {
      return 'Brill and Beggs'
    }
    if (selectedMethod === 'dak') {
      return 'Dranchuk and Abou-Kassem'
    }
    return 'Hall and Yarborough'
  }

  const computeCompleteResults = (config) => {
    const a = parseFloat(config.area) ? parseFloat(config.area) : 640
    const h = parseFloat(config.thickness) ? parseFloat(config.thickness) : 45
    const phi = parseFloat(config.porosity) ? parseFloat(config.porosity) : 0.18
    const swi = parseFloat(config.waterSat) ? parseFloat(config.waterSat) : 0.25
    const sgr = parseFloat(config.residualGasSat) ? parseFloat(config.residualGasSat) : 0.25
    const pi = parseFloat(config.pressure) ? parseFloat(config.pressure) : 3200
    const pa = parseFloat(config.abandonmentPressure) ? parseFloat(config.abandonmentPressure) : 500
    const tempF = parseFloat(config.temperature) ? parseFloat(config.temperature) : 180
    const gg = parseFloat(config.gasGravity) ? parseFloat(config.gasGravity) : 0.65
    const gorVal = parseFloat(config.gor) ? parseFloat(config.gor) : 120000
    const apiVal = parseFloat(config.apiGravity) ? parseFloat(config.apiGravity) : 55

    const activeZMethod = config.zMethod
    const activePseudoMethod = config.pseudoMethod
    const activeCriterion = config.classificationCriterion
    const activeDriveMechanism = config.driveMechanism
    const activeAquiferModel = config.aquiferModel
    const activeDeclineModel = config.declineModel
    const activeFieldStage = config.fieldStage

    // Step 1: Fluid Classification (Section 3.1 & Table 3.1)
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

    // Step 2: Pseudo-critical properties (Section 3.2.1)
    const initialReduced = calcPseudoReduced(pi, tempF, effectiveGasGravity, activePseudoMethod)
    const abandonmentReduced = calcPseudoReduced(pa, tempF, effectiveGasGravity, activePseudoMethod)

    // Calculate correlations at initial conditions (Hall-Yarborough, Brill-Beggs, DAK)
    const zBrillBeggsInitial = calcBrillBeggsZ(initialReduced.ppr, initialReduced.tpr)
    const zHallYarboroughInitial = calcHallYarboroughZ(initialReduced.ppr, initialReduced.tpr)
    const zDakInitial = calcDranchukAbouKassemZ(initialReduced.ppr, initialReduced.tpr)

    const zi = computeZByMethod(pi, tempF, effectiveGasGravity, activeZMethod, activePseudoMethod)
    const za = computeZByMethod(pa, tempF, effectiveGasGravity, activeZMethod, activePseudoMethod)

    // Step 3: Gas Formation Volume Factor Bg (Section 3.2 Eq. 3.1 & 3.2)
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

    // Step 4: Volumetric Reserves (Section 3.3 Eq. 3.11, UR, RF)
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

    // Step 5: Aquifer and Material Balance (Section 3.4, 3.5, 3.6)
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
      aquiferModel: activeAquiferModel,
      driveMechanism: activeDriveMechanism,
      calcZFunc: (pVal) => computeZByMethod(pVal, tempF, effectiveGasGravity, activeZMethod, activePseudoMethod),
      calcBgFunc: (pVal, zVal) =>
        calcBg({ pressurePsia: pVal, tempR: initialReduced.tempR, zFactor: zVal }),
      aquiferProps,
    })

    // Step 6: Decline Curve Analysis (Section 3.8)
    const qInit = parseFloat(config.initialRate) ? parseFloat(config.initialRate) : 12000
    const dNom = parseFloat(config.declineRate) ? parseFloat(config.declineRate) : 0.025
    const bExp = parseFloat(config.arpsB) ? parseFloat(config.arpsB) : 0.5
    const qAband = parseFloat(config.economicLimit) ? parseFloat(config.economicLimit) : 500

    const dcaRes = calcArpsDecline({
      model: activeDeclineModel,
      initialRateMscfDay: qInit,
      nominalDeclineRateMonthly: dNom,
      arpsB: bExp,
      months: 60,
      economicLimitMscfDay: qAband,
    })

    // Step 7: PRMS Probabilistic Reserves
    const prmsRes = calcPRMSReserves({
      areaAcres: a,
      netPayFeet: h,
      porosity: phi,
      initialWaterSat: swi,
      bgiCuftScf: bgiCuft,
      recoveryFactor: volRes.activeRf,
      iterations: 2500,
    })

    // Step 8: Method and Mechanism Recommendation
    const recommendation = recommendMethodAndMechanism({
      fieldStage: activeFieldStage,
      hasProductionHistory: activeFieldStage === 'mature' ? true : activeFieldStage === 'producing',
      driveSum: mbeRes.driveSum,
      idd: mbeRes.IDD,
      iwd: mbeRes.IWD,
      icd: mbeRes.ICD,
      volumetricEurBscf: volRes.eurBscf,
      mbeEurBscf: mbeRes.mbeEurBscf,
      dcaEurBscf: dcaRes.dcaEurBscf,
      prms2PBscf: prmsRes.reserve2P,
    })

    // Step 9: Multi-point Z-factor curve across pressure depletion
    const zCurve = []
    const pSteps = 10
    const deltaP = (pi - pa) / pSteps
    for (let i = 0; i <= pSteps; i++) {
      const pCurrent = pa + i * deltaP
      const { ppr: pprCurr, tpr: tprCurr } = calcPseudoReduced(pCurrent, tempF, effectiveGasGravity, activePseudoMethod)
      zCurve.push({
        pressure: Math.round(pCurrent),
        hallYarborough: parseFloat(calcHallYarboroughZ(pprCurr, tprCurr).toFixed(4)),
        brillBeggs: parseFloat(calcBrillBeggsZ(pprCurr, tprCurr).toFixed(4)),
        dak: parseFloat(calcDranchukAbouKassemZ(pprCurr, tprCurr).toFixed(4)),
      })
    }

    // Step 10: Pressure stages comparison matrix (reference grid)
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
          const { ppr: prVal, tpr: trVal } = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
          return calcHallYarboroughZ(prVal, trVal).toFixed(4)
        }),
      },
      {
        name: 'Brill and Beggs',
        key: 'brill_beggs',
        values: matrixStages.map((pVal) => {
          const { ppr: prVal, tpr: trVal } = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
          return calcBrillBeggsZ(prVal, trVal).toFixed(4)
        }),
      },
      {
        name: 'Dranchuk and Abou-Kassem',
        key: 'dak',
        values: matrixStages.map((pVal) => {
          const { ppr: prVal, tpr: trVal } = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
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
      prmsRes,
      recommendation,
      zCurve,
      pressureStages: matrixStages,
      correlationMatrix,
      activeZMethod,
      activePseudoMethod,
      activeDriveMechanism,
    }
  }

  // Active calculated results
  const [results, setResults] = useState(() => {
    return computeCompleteResults({
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
    })
  })

  const handleCalculate = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault()
    }
    const updated = computeCompleteResults({
      area,
      thickness,
      porosity,
      waterSat,
      residualGasSat,
      pressure,
      abandonmentPressure,
      temperature,
      gasGravity,
      gor,
      apiGravity,
      zMethod,
      pseudoMethod,
      classificationCriterion,
      driveMechanism,
      aquiferModel,
      declineModel,
      fieldStage,
      initialRate,
      declineRate,
      arpsB,
      economicLimit,
    })
    setResults(updated)
  }

  const driveIndicesData = useMemo(() => {
    return [
      {
        name: 'Gas Expansion (GDI / IDD)',
        value: Math.max(0.01, results.mbeRes.IDD),
        color: '#059669',
        percentage: (results.mbeRes.IDD * 100).toFixed(1),
      },
      {
        name: 'Water Influx (WDI / IWD)',
        value: Math.max(0.01, results.mbeRes.IWD),
        color: '#34d399',
        percentage: (results.mbeRes.IWD * 100).toFixed(1),
      },
      {
        name: 'Rock and Fluid (CDI / ICD)',
        value: Math.max(0.01, results.mbeRes.ICD),
        color: '#a7f3d0',
        percentage: (results.mbeRes.ICD * 100).toFixed(1),
      },
    ]
  }, [results.mbeRes.IDD, results.mbeRes.IWD, results.mbeRes.ICD])

  const chartThemeStyles = useMemo(() => {
    return {
      tooltip: {
        backgroundColor: theme === 'dark' ? '#163632' : '#111827',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.5rem 0.8rem',
      },
      axisStroke: theme === 'dark' ? '#475569' : '#9ca3af',
      tickFill: theme === 'dark' ? '#94a3b8' : '#6b7280',
      contrastLine: theme === 'dark' ? '#f9fafb' : '#111827',
    }
  }, [theme])

  const contextValue = {
    theme,
    handleThemeChange,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    searchQuery,
    setSearchQuery,
    activeChartTab,
    setActiveChartTab,
    area,
    setArea,
    thickness,
    setThickness,
    porosity,
    setPorosity,
    waterSat,
    setWaterSat,
    residualGasSat,
    setResidualGasSat,
    pressure,
    setPressure,
    abandonmentPressure,
    setAbandonmentPressure,
    temperature,
    setTemperature,
    gasGravity,
    setGasGravity,
    gor,
    setGor,
    apiGravity,
    setApiGravity,
    zMethod,
    setZMethod,
    pseudoMethod,
    setPseudoMethod,
    classificationCriterion,
    setClassificationCriterion,
    driveMechanism,
    setDriveMechanism,
    aquiferModel,
    setAquiferModel,
    declineModel,
    setDeclineModel,
    fieldStage,
    setFieldStage,
    initialRate,
    setInitialRate,
    declineRate,
    setDeclineRate,
    arpsB,
    setArpsB,
    economicLimit,
    setEconomicLimit,
    results,
    handleCalculate,
    getZMethodLabel,
    driveIndicesData,
    chartThemeStyles,
  }

  return (
    <ReservoirContext.Provider value={contextValue}>
      {children}
    </ReservoirContext.Provider>
  )
}

export function useReservoir() {
  const context = useContext(ReservoirContext)
  if (!context) {
    throw new Error('useReservoir must be used within a ReservoirProvider')
  }
  return context
}
