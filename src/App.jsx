import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  DashboardSquare01Icon,
  SlidersHorizontalIcon,
  ChartLineData01Icon,
  Database01Icon,
  Search01Icon,
  UserIcon,
} from 'hugeicons-react'
import {
  classifyReservoirFluid,
  calcPseudoReduced,
  calcBrillBeggsZ,
  calcBrillBeggsDetails,
  calcHallYarboroughZ,
  calcHallYarboroughDetails,
  calcDranchukAbouKassemZ,
  calcDranchukAbouKassemDetails,
  calcPapayZ,
  calcBg,
  calcWetGasProperties,
} from './utils/fluidProperties'
import { calcVolumetricReserves } from './utils/volumetric'
import {
  calcAquiferProperties,
  calcMaterialBalanceAndDriveIndices,
} from './utils/materialBalance'
import { calcArpsDecline } from './utils/declineCurve'
import {
  calcPRMSReserves,
  recommendMethodAndMechanism,
} from './utils/reservesAndRecommendation'
import './App.css'

function CollapsibleSection({ index, title, isOpen, onToggle, delay = 0, children }) {
  return (
    <motion.section
      className="collapsible-block"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="collapsible-trigger"
        aria-expanded={isOpen}
      >
        <span className="collapsible-title">{title}</span>
        <span className="collapsible-action">{isOpen ? 'Hide' : 'Show'}</span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="collapsible-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function App() {
  // Navigation View: dashboard, parameters, evaluation, diagnostics
  const [currentView, setCurrentView] = useState('dashboard')

  // Search input state
  const [searchQuery, setSearchQuery] = useState('')

  // Chart selection tab on dashboard card
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

  // Correlation Choices
  const [zMethod, setZMethod] = useState('hall_yarborough')
  const [pseudoMethod, setPseudoMethod] = useState('linear')
  const [classificationCriterion, setClassificationCriterion] = useState('ahmed')

  // Drive Mechanism, Aquifer and Decline Inputs
  const [driveMechanism, setDriveMechanism] = useState('volumetric')
  const [aquiferModel, setAquiferModel] = useState('fetkovich')
  const [declineModel, setDeclineModel] = useState('hyperbolic')
  const [fieldStage, setFieldStage] = useState('producing')
  const [initialRate, setInitialRate] = useState('12000')
  const [declineRate, setDeclineRate] = useState('0.025')
  const [arpsB, setArpsB] = useState('0.5')
  const [economicLimit, setEconomicLimit] = useState('500')

  const [activeSection, setActiveSection] = useState(0)

  const toggleSection = (index) => {
    setActiveSection((prev) => (prev === index ? -1 : index))
  }

  const computeZByMethod = (pPsia, tempF, gg, selectedMethod, selectedPseudoMethod) => {
    const { ppr, tpr } = calcPseudoReduced(pPsia, tempF, gg, selectedPseudoMethod)
    if (selectedMethod === 'brill_beggs') {
      return calcBrillBeggsZ(ppr, tpr)
    }
    if (selectedMethod === 'dak') {
      return calcDranchukAbouKassemZ(ppr, tpr)
    }
    if (selectedMethod === 'papay') {
      return calcPapayZ(ppr, tpr)
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
    if (selectedMethod === 'papay') {
      return 'Papay'
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

    // Step 1: Fluid Classification
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

    // Step 2: Pseudo-critical properties
    const initialReduced = calcPseudoReduced(pi, tempF, effectiveGasGravity, activePseudoMethod)
    const abandonmentReduced = calcPseudoReduced(pa, tempF, effectiveGasGravity, activePseudoMethod)

    // Calculate all four correlations at initial conditions
    const zBrillBeggsInitial = calcBrillBeggsZ(initialReduced.ppr, initialReduced.tpr)
    const zHallYarboroughInitial = calcHallYarboroughZ(initialReduced.ppr, initialReduced.tpr)
    const zDakInitial = calcDranchukAbouKassemZ(initialReduced.ppr, initialReduced.tpr)
    const zPapayInitial = calcPapayZ(initialReduced.ppr, initialReduced.tpr)

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

    // Step 3: Volumetric Reserves
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

    // Step 4: Water Influx, Material Balance, and Drive Energy Indices
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

    // Step 5: Comparative Z-Factor Curve across all four correlations
    const zCurve = []
    const maxP = Math.max(pi, 4500)
    for (let testP = 500; testP <= maxP; testP += 500) {
      const red = calcPseudoReduced(testP, tempF, effectiveGasGravity, activePseudoMethod)
      zCurve.push({
        pressure: testP,
        brillBeggs: Number(calcBrillBeggsZ(red.ppr, red.tpr).toFixed(4)),
        hallYarborough: Number(calcHallYarboroughZ(red.ppr, red.tpr).toFixed(4)),
        dak: Number(calcDranchukAbouKassemZ(red.ppr, red.tpr).toFixed(4)),
        papay: Number(calcPapayZ(red.ppr, red.tpr).toFixed(4)),
      })
    }

    // Step 6: Arps Decline Curve Analysis
    const dcaRes = calcArpsDecline({
      initialRateMscfDay: config.initialRate,
      nominalDeclinePerMonth: config.declineRate,
      hyperbolicExponentB: config.arpsB,
      economicLimitMscfDay: config.economicLimit,
      forecastMonths: 36,
    })

    let selectedDcaEur = dcaRes.eurHyperbolicBscf
    if (activeDeclineModel === 'exponential') {
      selectedDcaEur = dcaRes.eurExponentialBscf
    }
    if (activeDeclineModel === 'harmonic') {
      selectedDcaEur = dcaRes.eurHarmonicBscf
    }

    // Step 7: Unified Reserves Reconciliation
    const recommendation = recommendMethodAndMechanism({
      fluidType: classification.fluidType,
      driveMechanism: activeDriveMechanism,
      fieldStage: activeFieldStage,
      volumetricEurBscf: volRes.ultimateRecoveryBscf,
      mbeEurBscf: mbeRes.mbeEurBscf,
      dcaEurBscf: selectedDcaEur,
      IDD: mbeRes.IDD,
      ICD: mbeRes.ICD,
      IWD: mbeRes.IWD,
      zMethodLabel: getZMethodLabel(activeZMethod),
      effectiveGasGravity,
    })

    // Step 8: PRMS Monte Carlo Simulation
    const prmsRes = calcPRMSReserves({
      areaAcres: a,
      netPayFeet: h,
      porosity: phi,
      initialWaterSat: swi,
      bgiCuftScf: bgiCuft,
      activeRf: volRes.activeRf,
      baseTargetEurBscf: recommendation.finalRecommendedEurBscf,
      uncertaintySpread: recommendation.uncertaintySpread,
    })

    // Correlation Comparison Matrix across pressure stages
    const pressureStages = [500, 1500, 2500, 3500, Math.round(pi)]
    const correlationMatrix = [
      {
        name: 'Hall-Yarborough',
        key: 'hall_yarborough',
        values: pressureStages.map((pVal) => {
          const red = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
          return calcHallYarboroughZ(red.ppr, red.tpr).toFixed(3)
        }),
      },
      {
        name: 'Brill-Beggs',
        key: 'brill_beggs',
        values: pressureStages.map((pVal) => {
          const red = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
          return calcBrillBeggsZ(red.ppr, red.tpr).toFixed(3)
        }),
      },
      {
        name: 'Dranchuk-Abou-Kassem',
        key: 'dak',
        values: pressureStages.map((pVal) => {
          const red = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
          return calcDranchukAbouKassemZ(red.ppr, red.tpr).toFixed(3)
        }),
      },
      {
        name: 'Papay',
        key: 'papay',
        values: pressureStages.map((pVal) => {
          const red = calcPseudoReduced(pVal, tempF, effectiveGasGravity, activePseudoMethod)
          return calcPapayZ(red.ppr, red.tpr).toFixed(3)
        }),
      },
    ]

    return {
      classification,
      effectiveGasGravity: effectiveGasGravity.toFixed(4),
      initialReduced,
      abandonmentReduced,
      zBrillBeggsInitial: zBrillBeggsInitial.toFixed(4),
      zHallYarboroughInitial: zHallYarboroughInitial.toFixed(4),
      zDakInitial: zDakInitial.toFixed(4),
      zPapayInitial: zPapayInitial.toFixed(4),
      zi: zi.toFixed(4),
      za: za.toFixed(4),
      bgiCuft: bgiCuft.toFixed(5),
      bgiRb: bgiRb.toFixed(6),
      bgaCuft: bgaCuft.toFixed(5),
      volRes,
      wetProps,
      mbeRes,
      zCurve,
      dcaRes,
      selectedDcaEur: Number(selectedDcaEur.toFixed(2)),
      prmsRes,
      recommendation,
      activeZMethod,
      activePseudoMethod,
      activeCriterion,
      activeAquiferModel,
      activeDeclineModel,
      correlationMatrix,
      pressureStages,
    }
  }

  // Pre-calculate initial results on startup
  const [results, setResults] = useState(() =>
    computeCompleteResults({
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
      pseudoMethod: 'linear',
      classificationCriterion: 'ahmed',
      driveMechanism: 'volumetric',
      aquiferModel: 'fetkovich',
      declineModel: 'hyperbolic',
      fieldStage: 'producing',
      initialRate: '12000',
      declineRate: '0.025',
      arpsB: '0.5',
      economicLimit: '500',
    })
  )

  const handleCalculate = (e) => {
    if (e) e.preventDefault()

    const evaluated = computeCompleteResults({
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

    setResults(evaluated)
    setCurrentView('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCorrelationChange = (newMethod) => {
    setZMethod(newMethod)
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
      zMethod: newMethod,
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

  // Donut chart dataset for Reservoir Drive Indices
  const driveIndicesData = [
    {
      name: 'Gas Expansion (IDD)',
      value: Math.max(0.01, results.mbeRes.IDD),
      color: '#2563eb',
      percentage: (results.mbeRes.IDD * 100).toFixed(1),
    },
    {
      name: 'Water Influx (IWD)',
      value: Math.max(0.01, results.mbeRes.IWD),
      color: '#60a5fa',
      percentage: (results.mbeRes.IWD * 100).toFixed(1),
    },
    {
      name: 'Rock and Fluid (ICD)',
      value: Math.max(0.01, results.mbeRes.ICD),
      color: '#bfdbfe',
      percentage: (results.mbeRes.ICD * 100).toFixed(1),
    },
  ]

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <h2 className="brand-text">PetroReserves</h2>
            <div className="brand-subtext">Gas Evaluation Platform</div>
          </div>

          <nav className="sidebar-nav">
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            >
              <DashboardSquare01Icon size={20} />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('parameters')}
              className={`nav-button ${currentView === 'parameters' ? 'active' : ''}`}
            >
              <SlidersHorizontalIcon size={20} />
              <span>Parameters</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('evaluation')}
              className={`nav-button ${currentView === 'evaluation' ? 'active' : ''}`}
            >
              <Database01Icon size={20} />
              <span>Evaluation</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('diagnostics')}
              className={`nav-button ${currentView === 'diagnostics' ? 'active' : ''}`}
            >
              <ChartLineData01Icon size={20} />
              <span>Diagnostics</span>
            </button>

            <div className="nav-section-label">CORRELATION</div>

            <div style={{ padding: '0 0.5rem' }}>
              <select
                value={zMethod}
                onChange={(e) => handleCorrelationChange(e.target.value)}
                className="standard-input"
                style={{ fontSize: '0.82rem', padding: '0.55rem 0.75rem' }}
              >
                <option value="hall_yarborough">Hall-Yarborough</option>
                <option value="brill_beggs">Brill-Beggs</option>
                <option value="dak">Dranchuk-Abou-Kassem</option>
                <option value="papay">Papay</option>
              </select>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="appearance-card">
            <span className="appearance-label">Appearance</span>
            <span className="appearance-value">Light Clean</span>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-title">
            <h1>
              {currentView === 'dashboard' && 'Reservoir Overview'}
              {currentView === 'parameters' && 'Reservoir Parameters'}
              {currentView === 'evaluation' && 'Processed Evaluation'}
              {currentView === 'diagnostics' && 'Diagnostic Charts'}
            </h1>
          </div>

          <div className="topbar-actions">
            <div className="search-field">
              <span className="search-icon-holder">
                <Search01Icon size={16} />
              </span>
              <input
                type="text"
                placeholder="Search methods, inputs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <button
              type="button"
              onClick={() => handleCalculate()}
              className="top-action-btn"
            >
              Recalculate
            </button>
          </div>
        </header>

        {/* View 1: Primary Dashboard Grid (Mirroring Uploaded UI) */}
        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard-view"
            className="dashboard-grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Top Left Card: 2x2 Metric Grid */}
            <div className="grid-card">
              <div className="card-header-row">
                <h3 className="card-title">Reservoir Metrics</h3>
                <span className="card-subtitle">{results.classification.fluidType}</span>
              </div>

              <div className="kpi-matrix">
                <div className="kpi-cell">
                  <div className="kpi-icon-bubble">
                    <Database01Icon size={18} />
                  </div>
                  <span className="kpi-label">Original Gas in Place</span>
                  <div className="kpi-number">{results.volRes.giipBscf.toFixed(2)} Bscf</div>
                  <span className="kpi-context">Volumetric calculation</span>
                </div>

                <div className="kpi-cell">
                  <div className="kpi-icon-bubble">
                    <ChartLineData01Icon size={18} />
                  </div>
                  <span className="kpi-label">Recoverable Reserves</span>
                  <div className="kpi-number">{results.recommendation.finalRecommendedEurBscf.toFixed(2)} Bscf</div>
                  <span className="kpi-context">Recommended EUR</span>
                </div>

                <div className="kpi-cell">
                  <div className="kpi-icon-bubble">
                    <SlidersHorizontalIcon size={18} />
                  </div>
                  <span className="kpi-label">Recovery Factor</span>
                  <div className="kpi-number">{(results.volRes.activeRf * 100).toFixed(1)}%</div>
                  <span className="kpi-context">Based on {results.activeDriveMechanism === 'water_drive' ? 'water drive' : 'depletion'}</span>
                </div>

                <div className="kpi-cell">
                  <div className="kpi-icon-bubble">
                    <UserIcon size={18} />
                  </div>
                  <span className="kpi-label">Initial Z-Factor</span>
                  <div className="kpi-number">{results.zi}</div>
                  <span className="kpi-context">{getZMethodLabel(results.activeZMethod)}</span>
                </div>
              </div>
            </div>

            {/* Top Right Card: Correlation Heatmap / Comparison Matrix */}
            <div className="grid-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Z-Factor by Pressure</h3>
                  <div className="card-subtitle">Correlation comparison across depletion path</div>
                </div>
                <span className="card-subtitle">500 to {Math.round(parseFloat(pressure))} psia</span>
              </div>

              <div className="correlation-matrix-grid">
                <div className="matrix-row">
                  <span className="matrix-header-cell" style={{ textAlign: 'left' }}>Model</span>
                  {results.pressureStages.map((pVal, idx) => (
                    <span key={idx} className="matrix-header-cell">
                      {pVal} psi
                    </span>
                  ))}
                </div>

                {results.correlationMatrix.map((row) => (
                  <div key={row.key} className="matrix-row">
                    <span className="matrix-label">{row.name}</span>
                    {row.values.map((val, cellIdx) => {
                      const isSelected = row.key === results.activeZMethod
                      return (
                        <div
                          key={cellIdx}
                          className={`matrix-cell ${isSelected ? 'primary-match' : ''}`}
                        >
                          {val}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="matrix-legend">
                <span className="matrix-legend-item">Linear/Sutton Pseudocritical: {results.activePseudoMethod}</span>
                <span className="matrix-legend-item">Effective Gravity: {results.effectiveGasGravity}</span>
              </div>
            </div>

            {/* Bottom Left Card: Main Chart with Tab Switcher */}
            <div className="grid-card large-chart-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Reservoir Trends</h3>
                  <div className="card-subtitle">Depletion diagnostic and decline forecasts</div>
                </div>

                <div className="tab-selector-bar">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('pz')}
                    className={`tab-pill ${activeChartTab === 'pz' ? 'active' : ''}`}
                  >
                    p/z Plot
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('zcurve')}
                    className={`tab-pill ${activeChartTab === 'zcurve' ? 'active' : ''}`}
                  >
                    Z-Factor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('cole')}
                    className={`tab-pill ${activeChartTab === 'cole' ? 'active' : ''}`}
                  >
                    Cole Plot
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('dca')}
                    className={`tab-pill ${activeChartTab === 'dca' ? 'active' : ''}`}
                  >
                    Arps DCA
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('prms')}
                    className={`tab-pill ${activeChartTab === 'prms' ? 'active' : ''}`}
                  >
                    PRMS P90/P10
                  </button>
                </div>
              </div>

              <div className="chart-canvas-area">
                {activeChartTab === 'pz' && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.mbeRes.pzComparisonCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="gp" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="volumetricPz" name="Volumetric (Straight Line)" stroke="#111827" strokeWidth={2} dot={{ r: 2, fill: '#111827' }} />
                      <Line type="monotone" dataKey="waterDrivePz" name="Water Drive (Aquifer Support)" stroke="#2563eb" strokeWidth={2} dot={{ r: 2, fill: '#2563eb' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeChartTab === 'zcurve' && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.zCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="pressure" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis domain={['auto', 'auto']} stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="hallYarborough" name="Hall-Yarborough" stroke="#111827" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="brillBeggs" name="Brill-Beggs" stroke="#2563eb" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="dak" name="Dranchuk-Abou-Kassem" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="papay" name="Papay" stroke="#9ca3af" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeChartTab === 'cole' && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.mbeRes.havlenaOdehPoints} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="gpBscf" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Line type="monotone" dataKey="coleApparentGBscf" name="Apparent GIIP F/Eg (Bscf)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeChartTab === 'dca' && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.dcaRes.dcaCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="month" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="hyperbolicRate" name="Hyperbolic" stroke="#2563eb" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="exponentialRate" name="Exponential" stroke="#111827" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="harmonicRate" name="Harmonic" stroke="#9ca3af" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {activeChartTab === 'prms' && (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.prmsRes.probabilityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="exceedancePct" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Line type="monotone" dataKey="reservesBscf" name="Recoverable Reserves (Bscf)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Bottom Right Card: Donut Breakdown (Mirroring Sessions by Device) */}
            <div className="grid-card donut-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Drive Energy Indices</h3>
                  <div className="card-subtitle">Material balance volume contribution</div>
                </div>
              </div>

              <div className="donut-visual-container">
                <PieChart width={160} height={160}>
                  <Pie
                    data={driveIndicesData}
                    innerRadius={50}
                    outerRadius={70}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                  >
                    {driveIndicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>

                <div className="donut-center-metric">
                  <span className="donut-center-value">{results.mbeRes.driveSum.toFixed(2)}</span>
                  <span className="donut-center-label">Sum Check</span>
                </div>
              </div>

              <div className="donut-breakdown-list">
                {driveIndicesData.map((item, idx) => (
                  <div key={idx} className="donut-breakdown-row">
                    <span className="donut-breakdown-key">
                      <span className="donut-color-swatch" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="donut-breakdown-val">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* View 2: Parameters Form */}
        {currentView === 'parameters' && (
          <motion.div
            key="parameters-view"
            className="form-view-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <form onSubmit={handleCalculate}>
              <h2 className="form-block-heading" style={{ marginTop: 0 }}>Reservoir Rock and Geometry</h2>
              <div className="form-columns-grid">
                <div className="input-cell">
                  <label htmlFor="area">Drainage Area A (acres)</label>
                  <input
                    id="area"
                    type="number"
                    step="any"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="thickness">Net Pay Thickness h (feet)</label>
                  <input
                    id="thickness"
                    type="number"
                    step="any"
                    value={thickness}
                    onChange={(e) => setThickness(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="porosity">Porosity phi (fraction)</label>
                  <input
                    id="porosity"
                    type="number"
                    step="any"
                    value={porosity}
                    onChange={(e) => setPorosity(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="waterSat">Initial Water Saturation Swi (fraction)</label>
                  <input
                    id="waterSat"
                    type="number"
                    step="any"
                    value={waterSat}
                    onChange={(e) => setWaterSat(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="residualGasSat">Residual Gas Saturation Sgr (fraction)</label>
                  <input
                    id="residualGasSat"
                    type="number"
                    step="any"
                    value={residualGasSat}
                    onChange={(e) => setResidualGasSat(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>
              </div>

              <h2 className="form-block-heading">Fluid PVT and Correlations</h2>
              <div className="form-columns-grid">
                <div className="input-cell">
                  <label htmlFor="pressure">Initial Pressure pi (psia)</label>
                  <input
                    id="pressure"
                    type="number"
                    step="any"
                    value={pressure}
                    onChange={(e) => setPressure(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="abandonmentPressure">Abandonment Pressure pa (psia)</label>
                  <input
                    id="abandonmentPressure"
                    type="number"
                    step="any"
                    value={abandonmentPressure}
                    onChange={(e) => setAbandonmentPressure(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="temperature">Reservoir Temperature (Fahrenheit)</label>
                  <input
                    id="temperature"
                    type="number"
                    step="any"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="gasGravity">Gas Specific Gravity (air = 1.0)</label>
                  <input
                    id="gasGravity"
                    type="number"
                    step="any"
                    value={gasGravity}
                    onChange={(e) => setGasGravity(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="gor">Initial Producing GOR (scf/STB)</label>
                  <input
                    id="gor"
                    type="number"
                    step="any"
                    value={gor}
                    onChange={(e) => setGor(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="apiGravity">Condensate Gravity (API)</label>
                  <input
                    id="apiGravity"
                    type="number"
                    step="any"
                    value={apiGravity}
                    onChange={(e) => setApiGravity(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="zMethod">Primary Z-Factor Correlation</label>
                  <select
                    id="zMethod"
                    value={zMethod}
                    onChange={(e) => setZMethod(e.target.value)}
                    className="standard-input"
                  >
                    <option value="hall_yarborough">Hall and Yarborough</option>
                    <option value="brill_beggs">Brill and Beggs</option>
                    <option value="dak">Dranchuk and Abou-Kassem</option>
                    <option value="papay">Papay</option>
                  </select>
                </div>

                <div className="input-cell">
                  <label htmlFor="pseudoMethod">Pseudocritical Property Model</label>
                  <select
                    id="pseudoMethod"
                    value={pseudoMethod}
                    onChange={(e) => setPseudoMethod(e.target.value)}
                    className="standard-input"
                  >
                    <option value="linear">Standard Linear</option>
                    <option value="sutton">Sutton (1985)</option>
                  </select>
                </div>

                <div className="input-cell">
                  <label htmlFor="classificationCriterion">Fluid Classification Standard</label>
                  <select
                    id="classificationCriterion"
                    value={classificationCriterion}
                    onChange={(e) => setClassificationCriterion(e.target.value)}
                    className="standard-input"
                  >
                    <option value="ahmed">Ahmed (2019)</option>
                    <option value="mccain">McCain (1990)</option>
                  </select>
                </div>
              </div>

              <h2 className="form-block-heading">Drive Mechanism, Aquifer and Decline</h2>
              <div className="form-columns-grid">
                <div className="input-cell">
                  <label htmlFor="driveMechanism">Reservoir Drive Mechanism</label>
                  <select
                    id="driveMechanism"
                    value={driveMechanism}
                    onChange={(e) => setDriveMechanism(e.target.value)}
                    className="standard-input"
                  >
                    <option value="volumetric">Volumetric Depletion Drive</option>
                    <option value="water_drive">Active Water Drive</option>
                  </select>
                </div>

                <div className="input-cell">
                  <label htmlFor="aquiferModel">Aquifer Water Influx Model</label>
                  <select
                    id="aquiferModel"
                    value={aquiferModel}
                    onChange={(e) => setAquiferModel(e.target.value)}
                    className="standard-input"
                  >
                    <option value="fetkovich">Fetkovich Finite Aquifer</option>
                    <option value="schilthuis">Schilthuis Steady-State</option>
                    <option value="hurst">Hurst Modified Steady-State</option>
                    <option value="veh">van Everdingen and Hurst</option>
                    <option value="carter_tracy">Carter and Tracy</option>
                    <option value="pot">Pot Aquifer</option>
                  </select>
                </div>

                <div className="input-cell">
                  <label htmlFor="declineModel">Primary Decline Curve Model</label>
                  <select
                    id="declineModel"
                    value={declineModel}
                    onChange={(e) => setDeclineModel(e.target.value)}
                    className="standard-input"
                  >
                    <option value="hyperbolic">Arps Hyperbolic</option>
                    <option value="exponential">Arps Exponential</option>
                    <option value="harmonic">Arps Harmonic</option>
                  </select>
                </div>

                <div className="input-cell">
                  <label htmlFor="fieldStage">Field Maturity Stage</label>
                  <select
                    id="fieldStage"
                    value={fieldStage}
                    onChange={(e) => setFieldStage(e.target.value)}
                    className="standard-input"
                  >
                    <option value="early">Early Appraisal</option>
                    <option value="producing">Active Depletion</option>
                    <option value="mature">Late Field Life</option>
                  </select>
                </div>

                <div className="input-cell">
                  <label htmlFor="initialRate">Initial Gas Rate qi (Mscf/day)</label>
                  <input
                    id="initialRate"
                    type="number"
                    step="any"
                    value={initialRate}
                    onChange={(e) => setInitialRate(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="declineRate">Nominal Decline Rate Di (1/month)</label>
                  <input
                    id="declineRate"
                    type="number"
                    step="any"
                    value={declineRate}
                    onChange={(e) => setDeclineRate(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="arpsB">Arps Exponent b (0 to 1)</label>
                  <input
                    id="arpsB"
                    type="number"
                    step="any"
                    value={arpsB}
                    onChange={(e) => setArpsB(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="economicLimit">Economic Limit qa (Mscf/day)</label>
                  <input
                    id="economicLimit"
                    type="number"
                    step="any"
                    value={economicLimit}
                    onChange={(e) => setEconomicLimit(e.target.value)}
                    className="standard-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="primary-submit-btn">
                Run Reserves Estimation
              </button>
            </form>
          </motion.div>
        )}

        {/* View 3: Processed Evaluation (Accordion) */}
        {currentView === 'evaluation' && (
          <motion.div
            key="evaluation-view"
            className="evaluation-view-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="evaluation-header">
              <h2>Detailed Reservoir Evaluation</h2>
              <p>Reconciled reserves, fluid thermodynamics, material balance, and Arps decline forecasts.</p>
            </div>

            <div className="collapsible-list">
              <CollapsibleSection
                index={0}
                title="Unified Reserves Reconciliation and Final Recommendation"
                isOpen={activeSection === 0}
                onToggle={toggleSection}
                delay={0.05}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Final Recommended Reserves</span>
                    <span className="data-value">{results.recommendation.finalRecommendedEurBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Recommended Method</span>
                    <span className="data-value">{results.recommendation.recommendedMethod}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Reconciled Weighted Reserves</span>
                    <span className="data-value">{results.recommendation.reconciledWeightedEurBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Volumetric EUR</span>
                    <span className="data-value">{results.recommendation.volumetricEurBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Material Balance EUR</span>
                    <span className="data-value">{results.recommendation.mbeEurBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Arps Decline Curve EUR</span>
                    <span className="data-value">{results.selectedDcaEur.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">1P Proved Reserves (P90)</span>
                    <span className="data-value">{results.prmsRes.reserve1P.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">2P Probable Reserves (P50)</span>
                    <span className="data-value">{results.prmsRes.reserve2P.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">3P Possible Reserves (P10)</span>
                    <span className="data-value">{results.prmsRes.reserve3P.toFixed(2)} Bscf</span>
                  </div>
                </div>
                <p className="diagnostic-note">{results.recommendation.evidence}</p>
              </CollapsibleSection>

              <CollapsibleSection
                index={1}
                title="Fluid Classification and Wet-Gas Equivalence"
                isOpen={activeSection === 1}
                onToggle={toggleSection}
                delay={0.08}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Reservoir Fluid Type</span>
                    <span className="data-value">{results.classification.fluidType}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Classification Standard</span>
                    <span className="data-value">{results.classification.criterionName}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Phase Regime</span>
                    <span className="data-value">{results.classification.phaseRegime}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Well-Stream Specific Gravity</span>
                    <span className="data-value">{results.wetProps.wellStreamGravity.toFixed(4)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Gas Equivalent of Condensate</span>
                    <span className="data-value">{results.wetProps.gasEquivalentGE.toFixed(0)} scf/STB</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Surface Gas in Place (Gs)</span>
                    <span className="data-value">{(results.wetProps.surfaceGasInPlaceScf / 1e9).toFixed(2)} Bscf</span>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={2}
                title="Gas Properties and Z-Factor Correlations"
                isOpen={activeSection === 2}
                onToggle={toggleSection}
                delay={0.11}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Selected Z Correlation</span>
                    <span className="data-value">{getZMethodLabel(results.activeZMethod)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial Z-Factor (zi)</span>
                    <span className="data-value">{results.zi}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Abandonment Z-Factor (za)</span>
                    <span className="data-value">{results.za}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Pseudo-Reduced Pressure Ppr</span>
                    <span className="data-value">{results.initialReduced.ppr.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Pseudo-Reduced Temp Tpr</span>
                    <span className="data-value">{results.initialReduced.tpr.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial Bgi (ft3/scf)</span>
                    <span className="data-value">{results.bgiCuft} ft3/scf</span>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={3}
                title="Volumetric and Material Balance Calculations"
                isOpen={activeSection === 3}
                onToggle={toggleSection}
                delay={0.14}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Volumetric Gas in Place</span>
                    <span className="data-value">{results.volRes.giipBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Material Balance Gas in Place</span>
                    <span className="data-value">{results.mbeRes.mbeGiipBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Recovery Factor</span>
                    <span className="data-value">{(results.volRes.activeRf * 100).toFixed(1)}%</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial pi/zi Intercept</span>
                    <span className="data-value">{results.volRes.piOverZi.toFixed(0)} psia</span>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </motion.div>
        )}

        {/* View 4: Diagnostics Charts */}
        {currentView === 'diagnostics' && (
          <motion.div
            key="diagnostics-view"
            className="evaluation-view-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="evaluation-header">
              <h2>Diagnostic Analytical Charts</h2>
              <p>Full-size diagnostic curves for depletion verification and pressure response.</p>
            </div>

            <div className="collapsible-list">
              <div className="grid-card" style={{ marginBottom: '1.5rem' }}>
                <h3 className="card-title">Material Balance: p/z vs Cumulative Production</h3>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={results.mbeRes.pzComparisonCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="gp" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="volumetricPz" name="Volumetric Depletion" stroke="#111827" strokeWidth={2} dot={{ r: 2, fill: '#111827' }} />
                      <Line type="monotone" dataKey="waterDrivePz" name="Water Drive Support" stroke="#2563eb" strokeWidth={2} dot={{ r: 2, fill: '#2563eb' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid-card">
                <h3 className="card-title">Z-Factor Correlations Across Pressure</h3>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={results.zCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <XAxis dataKey="pressure" stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <YAxis domain={['auto', 'auto']} stroke="#9ca3af" tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.5rem 0.8rem' }} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="hallYarborough" name="Hall-Yarborough" stroke="#111827" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="brillBeggs" name="Brill-Beggs" stroke="#2563eb" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="dak" name="Dranchuk-Abou-Kassem" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="papay" name="Papay" stroke="#9ca3af" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default App
