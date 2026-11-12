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
} from 'recharts'
import {
  classifyReservoirFluid,
  calcPseudoReduced,
  calcBrillBeggsZ,
  calcHallYarboroughZ,
  calcDranchukAbouKassemZ,
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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
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
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="collapsible-panel"
          >
            <div className="collapsible-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

function App() {
  // Reservoir & Petrophysical Inputs
  const [area, setArea] = useState('640')
  const [thickness, setThickness] = useState('45')
  const [porosity, setPorosity] = useState('0.18')
  const [waterSat, setWaterSat] = useState('0.25')
  const [residualGasSat, setResidualGasSat] = useState('0.25')

  // Fluid & Pressure Inputs
  const [pressure, setPressure] = useState('3200')
  const [abandonmentPressure, setAbandonmentPressure] = useState('500')
  const [temperature, setTemperature] = useState('180')
  const [gasGravity, setGasGravity] = useState('0.65')
  const [gor, setGor] = useState('120000')
  const [apiGravity, setApiGravity] = useState('55')
  const [zMethod, setZMethod] = useState('hall_yarborough')

  // Drive Mechanism, Aquifer & Decline Inputs
  const [driveMechanism, setDriveMechanism] = useState('volumetric')
  const [aquiferModel, setAquiferModel] = useState('fetkovich')
  const [fieldStage, setFieldStage] = useState('producing')
  const [initialRate, setInitialRate] = useState('12000')
  const [declineRate, setDeclineRate] = useState('0.025')
  const [arpsB, setArpsB] = useState('0.5')
  const [economicLimit, setEconomicLimit] = useState('500')

  const [currentView, setCurrentView] = useState('form')
  const [results, setResults] = useState(null)
  const [activeSection, setActiveSection] = useState(0)

  const toggleSection = (index) => {
    setActiveSection((prev) => (prev === index ? -1 : index))
  }

  const computeZByMethod = (pPsia, tempF, gg, selectedMethod) => {
    const { ppr, tpr } = calcPseudoReduced(pPsia, tempF, gg, 'chapter3')
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

  const handleCalculate = (e) => {
    e.preventDefault()

    const a = parseFloat(area) ? parseFloat(area) : 640
    const h = parseFloat(thickness) ? parseFloat(thickness) : 45
    const phi = parseFloat(porosity) ? parseFloat(porosity) : 0.18
    const swi = parseFloat(waterSat) ? parseFloat(waterSat) : 0.25
    const sgr = parseFloat(residualGasSat) ? parseFloat(residualGasSat) : 0.25
    const pi = parseFloat(pressure) ? parseFloat(pressure) : 3200
    const pa = parseFloat(abandonmentPressure) ? parseFloat(abandonmentPressure) : 500
    const tempF = parseFloat(temperature) ? parseFloat(temperature) : 180
    const gg = parseFloat(gasGravity) ? parseFloat(gasGravity) : 0.65
    const gorVal = parseFloat(gor) ? parseFloat(gor) : 120000
    const apiVal = parseFloat(apiGravity) ? parseFloat(apiGravity) : 55

    // Step 1: Fluid Classification & Preliminary Wet-Gas Gravity Link
    const classification = classifyReservoirFluid({
      gorScfStb: gorVal,
      apiGravity: apiVal,
      reservoirTempF: tempF,
      dewPointPsia: 0,
      initialPressurePsia: pi,
    })

    const prelimWetProps = calcWetGasProperties({
      gorScfStb: gorVal,
      apiGravity: apiVal,
      surfaceGasGravity: gg,
      wellStreamGasInPlaceScf: 0,
    })

    // Tie fluid type into effective gas gravity for Z-factor correlations
    const effectiveGasGravity =
      classification.fluidType === 'Dry Gas'
        ? gg
        : prelimWetProps.wellStreamGravity

    // Step 2: Pseudo-Critical, Pseudo-Reduced, Z-Factor, and Bg
    const initialReduced = calcPseudoReduced(pi, tempF, effectiveGasGravity, 'chapter3')
    const zBrillBeggsInitial = calcBrillBeggsZ(initialReduced.ppr, initialReduced.tpr)
    const zHallYarboroughInitial = calcHallYarboroughZ(initialReduced.ppr, initialReduced.tpr)
    const zDakInitial = calcDranchukAbouKassemZ(initialReduced.ppr, initialReduced.tpr)

    const zi = computeZByMethod(pi, tempF, effectiveGasGravity, zMethod)
    const za = computeZByMethod(pa, tempF, effectiveGasGravity, zMethod)

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

    // Step 3: Volumetric Reserves & Wet-Gas Surface Gas / Condensate Split
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
      driveMechanism,
    })

    const wetProps = calcWetGasProperties({
      gorScfStb: gorVal,
      apiGravity: apiVal,
      surfaceGasGravity: gg,
      wellStreamGasInPlaceScf: volRes.giipScf,
    })

    // Step 4: Aquifer Influx, Havlena-Odeh Material Balance, and Drive Energy Indices
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
      aquiferModel,
      driveMechanism,
      calcZFunc: (pVal) => computeZByMethod(pVal, tempF, effectiveGasGravity, zMethod),
      calcBgFunc: (pVal, zVal) =>
        calcBg({ pressurePsia: pVal, tempR: initialReduced.tempR, zFactor: zVal }),
      aquiferProps,
    })

    // Step 5: Z-Factor vs Pressure Curve across all 3 correlations
    const zCurve = []
    const maxP = Math.max(pi, 4500)
    for (let testP = 500; testP <= maxP; testP += 500) {
      const red = calcPseudoReduced(testP, tempF, effectiveGasGravity, 'chapter3')
      zCurve.push({
        pressure: testP,
        brillBeggs: Number(calcBrillBeggsZ(red.ppr, red.tpr).toFixed(4)),
        hallYarborough: Number(calcHallYarboroughZ(red.ppr, red.tpr).toFixed(4)),
        dak: Number(calcDranchukAbouKassemZ(red.ppr, red.tpr).toFixed(4)),
      })
    }

    // Step 6: Arps Decline Curve Analysis
    const dcaRes = calcArpsDecline({
      initialRateMscfDay: initialRate,
      nominalDeclinePerMonth: declineRate,
      hyperbolicExponentB: arpsB,
      economicLimitMscfDay: economicLimit,
      forecastMonths: 36,
    })

    // Step 7: Reconcile Volumetric, Material Balance, and Decline Curve Reserves
    const recommendation = recommendMethodAndMechanism({
      fluidType: classification.fluidType,
      driveMechanism,
      fieldStage,
      volumetricEurBscf: volRes.ultimateRecoveryBscf,
      mbeEurBscf: mbeRes.mbeEurBscf,
      dcaEurBscf: dcaRes.eurHyperbolicBscf,
      IDD: mbeRes.IDD,
      ICD: mbeRes.ICD,
      IWD: mbeRes.IWD,
      zMethodLabel: getZMethodLabel(zMethod),
      effectiveGasGravity,
    })

    // Step 8: Tie PRMS 1P, 2P, 3P Monte Carlo to the Recommended Reserves and Class Spread
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

    setResults({
      classification,
      effectiveGasGravity: effectiveGasGravity.toFixed(4),
      initialReduced,
      zBrillBeggsInitial: zBrillBeggsInitial.toFixed(4),
      zHallYarboroughInitial: zHallYarboroughInitial.toFixed(4),
      zDakInitial: zDakInitial.toFixed(4),
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
      prmsRes,
      recommendation,
    })

    // First section expanded, all others collapsed in single-open accordion
    setActiveSection(0)
    setCurrentView('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToForm = () => {
    setCurrentView('form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="center-container">
      <AnimatePresence mode="wait">
        {currentView === 'form' ? (
          <motion.div
            key="form-view"
            className="content-wrap form-width"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <header className="intro-block">
              <h1>Gas Reserves Estimation</h1>
              <p>
                Enter reservoir, fluid, aquifer, and decline parameters to run the gas reserves estimation models.
              </p>
            </header>

            <form onSubmit={handleCalculate} className="form-stack">
              <h2 className="form-section-title">Reservoir Rock and Geometry</h2>

              <div className="field-group">
                <label htmlFor="area">Drainage Area A (acres)</label>
                <input
                  id="area"
                  type="number"
                  step="any"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="thickness">Net Pay Thickness h (feet)</label>
                <input
                  id="thickness"
                  type="number"
                  step="any"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="porosity">Porosity phi (fraction)</label>
                <input
                  id="porosity"
                  type="number"
                  step="any"
                  value={porosity}
                  onChange={(e) => setPorosity(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="waterSat">Initial Water Saturation Swi (fraction)</label>
                <input
                  id="waterSat"
                  type="number"
                  step="any"
                  value={waterSat}
                  onChange={(e) => setWaterSat(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="residualGasSat">Residual Gas Saturation Sgr (fraction)</label>
                <input
                  id="residualGasSat"
                  type="number"
                  step="any"
                  value={residualGasSat}
                  onChange={(e) => setResidualGasSat(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <h2 className="form-section-title">Fluid PVT and Z-Factor Correlation</h2>

              <div className="field-group">
                <label htmlFor="pressure">Initial Reservoir Pressure pi (psia)</label>
                <input
                  id="pressure"
                  type="number"
                  step="any"
                  value={pressure}
                  onChange={(e) => setPressure(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="abandonmentPressure">Abandonment Pressure pa (psia)</label>
                <input
                  id="abandonmentPressure"
                  type="number"
                  step="any"
                  value={abandonmentPressure}
                  onChange={(e) => setAbandonmentPressure(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="temperature">Reservoir Temperature T (Fahrenheit)</label>
                <input
                  id="temperature"
                  type="number"
                  step="any"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="gasGravity">Gas Specific Gravity (air = 1.0)</label>
                <input
                  id="gasGravity"
                  type="number"
                  step="any"
                  value={gasGravity}
                  onChange={(e) => setGasGravity(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="gor">Initial Producing GOR (scf/STB)</label>
                <input
                  id="gor"
                  type="number"
                  step="any"
                  value={gor}
                  onChange={(e) => setGor(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="apiGravity">Condensate Gravity (API)</label>
                <input
                  id="apiGravity"
                  type="number"
                  step="any"
                  value={apiGravity}
                  onChange={(e) => setApiGravity(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="zMethod">Primary Z-Factor Correlation</label>
                <select
                  id="zMethod"
                  value={zMethod}
                  onChange={(e) => setZMethod(e.target.value)}
                  className="text-input"
                >
                  <option value="hall_yarborough">Hall and Yarborough (Iterative EOS)</option>
                  <option value="brill_beggs">Brill and Beggs (Explicit)</option>
                  <option value="dak">Dranchuk and Abou-Kassem (11-Constant EOS)</option>
                </select>
              </div>

              <h2 className="form-section-title">Drive Mechanism, Aquifer, and Decline</h2>

              <div className="field-group">
                <label htmlFor="driveMechanism">Reservoir Drive Mechanism</label>
                <select
                  id="driveMechanism"
                  value={driveMechanism}
                  onChange={(e) => setDriveMechanism(e.target.value)}
                  className="text-input"
                >
                  <option value="volumetric">Volumetric Depletion Drive (No Water Influx)</option>
                  <option value="water_drive">Active Water Drive (Aquifer Encroachment)</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="aquiferModel">Aquifer Water Influx Model</label>
                <select
                  id="aquiferModel"
                  value={aquiferModel}
                  onChange={(e) => setAquiferModel(e.target.value)}
                  className="text-input"
                >
                  <option value="fetkovich">Fetkovich Finite Aquifer</option>
                  <option value="schilthuis">Schilthuis Steady-State</option>
                  <option value="veh">van Everdingen and Hurst Unsteady-State</option>
                  <option value="carter_tracy">Carter and Tracy Recursion</option>
                  <option value="pot">Pot Aquifer</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="fieldStage">Field Maturity Stage</label>
                <select
                  id="fieldStage"
                  value={fieldStage}
                  onChange={(e) => setFieldStage(e.target.value)}
                  className="text-input"
                >
                  <option value="early">Early Appraisal (Static Data Only)</option>
                  <option value="producing">Active Depletion (Pressure and Production History)</option>
                  <option value="mature">Late Field Life (Decline Curve Trend)</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="initialRate">Initial Gas Rate qi (Mscf/day)</label>
                <input
                  id="initialRate"
                  type="number"
                  step="any"
                  value={initialRate}
                  onChange={(e) => setInitialRate(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="declineRate">Initial Nominal Decline Rate Di (1/month)</label>
                <input
                  id="declineRate"
                  type="number"
                  step="any"
                  value={declineRate}
                  onChange={(e) => setDeclineRate(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="arpsB">Arps Hyperbolic Exponent b (0 to 1)</label>
                <input
                  id="arpsB"
                  type="number"
                  step="any"
                  value={arpsB}
                  onChange={(e) => setArpsB(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="economicLimit">Economic Limit Rate qa (Mscf/day)</label>
                <input
                  id="economicLimit"
                  type="number"
                  step="any"
                  value={economicLimit}
                  onChange={(e) => setEconomicLimit(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="button-group">
                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileTap={{ scale: 0.99 }}
                >
                  Run Reserves Estimation
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="results-view"
            className="content-wrap results-width"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <motion.header
              className="results-header"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <motion.button
                type="button"
                onClick={handleBackToForm}
                className="back-btn"
                whileTap={{ scale: 0.98 }}
              >
                Back to Parameters
              </motion.button>
              <h1>Processed Reservoir Evaluation</h1>
              <p>Complete fluid characterization, Z-factor correlations, volumetric, material balance, aquifer influx, and decline curve outputs.</p>
            </motion.header>

            <div className="collapsible-list">
              <CollapsibleSection
                index={0}
                title="Unified Reserves Reconciliation and Final Recommendation"
                isOpen={activeSection === 0}
                onToggle={toggleSection}
                delay={0.08}
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
                    <span className="data-value">{results.recommendation.dcaEurBscf.toFixed(2)} Bscf</span>
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
                  <div className="data-item">
                    <span className="data-label">Dominant Drive Mechanism</span>
                    <span className="data-value">{results.recommendation.dominantDrive}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Assigned Reservoir Class</span>
                    <span className="data-value">{results.recommendation.reservoirClass}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Reservoir Fluid Type</span>
                    <span className="data-value">{results.classification.fluidType}</span>
                  </div>
                </div>
                <p className="diagnostic-note">{results.recommendation.evidence}</p>
              </CollapsibleSection>

              <CollapsibleSection
                index={1}
                title="Fluid Classification and Wet-Gas Equivalence"
                isOpen={activeSection === 1}
                onToggle={toggleSection}
                delay={0.11}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Reservoir Fluid Type</span>
                    <span className="data-value">{results.classification.fluidType}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Phase Regime</span>
                    <span className="data-value">{results.classification.phaseRegime}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Effective Gravity for Z-Factor</span>
                    <span className="data-value">{results.effectiveGasGravity}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Well-Stream Specific Gravity</span>
                    <span className="data-value">{results.wetProps.wellStreamGravity.toFixed(4)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Gas Equivalent of Condensate (GE)</span>
                    <span className="data-value">{results.wetProps.gasEquivalentGE.toFixed(0)} scf/STB</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Dry Surface Gas in Place (Gs)</span>
                    <span className="data-value">{(results.wetProps.surfaceGasInPlaceScf / 1e9).toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial Condensate in Place (Nc)</span>
                    <span className="data-value">{(results.wetProps.initialCondensateInPlaceStb / 1e6).toFixed(2)} MMSTB</span>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={2}
                title="Gas Properties and Z-Factor Correlations at Initial Conditions"
                isOpen={activeSection === 2}
                onToggle={toggleSection}
                delay={0.14}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Pseudo-Reduced Pressure (Ppr)</span>
                    <span className="data-value">{results.initialReduced.ppr.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Pseudo-Reduced Temp (Tpr)</span>
                    <span className="data-value">{results.initialReduced.tpr.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Hall-Yarborough Z (zi)</span>
                    <span className="data-value">{results.zHallYarboroughInitial}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Brill and Beggs Z (zi)</span>
                    <span className="data-value">{results.zBrillBeggsInitial}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Dranchuk-Abou-Kassem Z (zi)</span>
                    <span className="data-value">{results.zDakInitial}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Active Initial Z (zi)</span>
                    <span className="data-value">{results.zi}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Active Abandonment Z (za)</span>
                    <span className="data-value">{results.za}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial Bgi (ft3/scf)</span>
                    <span className="data-value">{results.bgiCuft} ft3/scf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial Bgi (rb/scf)</span>
                    <span className="data-value">{results.bgiRb} rb/scf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Abandonment Bga</span>
                    <span className="data-value">{results.bgaCuft} ft3/scf</span>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={3}
                title="Volumetric and Material Balance Breakdown"
                isOpen={activeSection === 3}
                onToggle={toggleSection}
                delay={0.17}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Volumetric Gas in Place (G)</span>
                    <span className="data-value">{results.volRes.giipBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Material Balance Gas in Place</span>
                    <span className="data-value">{results.mbeRes.mbeGiipBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Apparent Cole GIIP (F/Eg)</span>
                    <span className="data-value">{results.mbeRes.apparentColeGiipBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Volumetric Recovery Factor</span>
                    <span className="data-value">{(results.volRes.rfVolumetric * 100).toFixed(1)}%</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Water-Drive Recovery Factor</span>
                    <span className="data-value">{(results.volRes.rfWaterDrive * 100).toFixed(1)}%</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Volumetric EUR</span>
                    <span className="data-value">{results.volRes.ultimateRecoveryBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Material Balance EUR</span>
                    <span className="data-value">{results.mbeRes.mbeEurBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Initial pi/zi Intercept</span>
                    <span className="data-value">{results.volRes.piOverZi.toFixed(0)} psia</span>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={4}
                title="Reservoir Drive Energy Indices and Aquifer Influx"
                isOpen={activeSection === 4}
                onToggle={toggleSection}
                delay={0.2}
              >
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Depletion Drive Index (IDD)</span>
                    <span className="data-value">{results.mbeRes.IDD.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Compaction Drive Index (ICD)</span>
                    <span className="data-value">{results.mbeRes.ICD.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Water Drive Index (IWD)</span>
                    <span className="data-value">{results.mbeRes.IWD.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Drive Index Sum Check</span>
                    <span className="data-value">{results.mbeRes.driveSum.toFixed(3)}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Cumulative Water Influx (We)</span>
                    <span className="data-value">{(results.mbeRes.cumulativeWeBbl / 1e6).toFixed(2)} MMbbl</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Arps Hyperbolic EUR</span>
                    <span className="data-value">{results.dcaRes.eurHyperbolicBscf.toFixed(2)} Bscf</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Time to Economic Limit (ta)</span>
                    <span className="data-value">{results.dcaRes.taHyperbolicMonths.toFixed(1)} months</span>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={5}
                title="Material Balance: p/z vs Cumulative Gas Production"
                isOpen={activeSection === 5}
                onToggle={toggleSection}
                delay={0.23}
              >
                <p className="chart-desc">
                  Comparison of linear volumetric depletion against water-drive pressure support curvature.
                </p>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.mbeRes.pzComparisonCurve} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <XAxis
                        dataKey="gp"
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Cumulative Gas Gp (Bscf)', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'p/z (psia)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="volumetricPz"
                        name="Volumetric Depletion (Straight Line)"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#111827' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="waterDrivePz"
                        name="Water Drive (Aquifer Support)"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#9ca3af' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={6}
                title="Z-Factor Correlations Across Pressure"
                isOpen={activeSection === 6}
                onToggle={toggleSection}
                delay={0.26}
              >
                <p className="chart-desc">
                  Comparison of Hall-Yarborough, Brill and Beggs, and Dranchuk-Abou-Kassem Z-factor predictions across pressure.
                </p>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.zCurve} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <XAxis
                        dataKey="pressure"
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Pressure (psia)', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 11 }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Z-Factor', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="hallYarborough"
                        name="Hall-Yarborough"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="brillBeggs"
                        name="Brill and Beggs"
                        stroke="#6b7280"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="dak"
                        name="Dranchuk-Abou-Kassem"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={7}
                title="Cole Diagnostic Plot: Apparent GIIP (F/Eg) vs Cumulative Gas Production"
                isOpen={activeSection === 7}
                onToggle={toggleSection}
                delay={0.29}
              >
                <p className="chart-desc">
                  For a volumetric reservoir, F/Eg remains flat at true gas in place. An upward trend indicates active water influx.
                </p>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.mbeRes.havlenaOdehPoints} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <XAxis
                        dataKey="gpBscf"
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Cumulative Gas Gp (Bscf)', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 11 }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'F/Eg Apparent G (Bscf)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="coleApparentGBscf"
                        name="Apparent GIIP (F/Eg)"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#111827' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={8}
                title="Arps Decline Curve Analysis: Exponential, Hyperbolic, and Harmonic"
                isOpen={activeSection === 8}
                onToggle={toggleSection}
                delay={0.32}
              >
                <p className="chart-desc">
                  Production rate forecast over 36 months comparing Exponential (b=0), Hyperbolic (b={arpsB}), and Harmonic (b=1) models.
                </p>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.dcaRes.dcaCurve} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <XAxis
                        dataKey="month"
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Production Month', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Rate (Mscf/day)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12, paddingBottom: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="hyperbolicRate"
                        name="Hyperbolic"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="exponentialRate"
                        name="Exponential"
                        stroke="#6b7280"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="harmonicRate"
                        name="Harmonic"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                index={9}
                title="PRMS Probabilistic Reserves Exceedance Curve"
                isOpen={activeSection === 9}
                onToggle={toggleSection}
                delay={0.35}
              >
                <p className="chart-desc">
                  Cumulative probability distribution from Monte Carlo simulation showing P90 (1P), P50 (2P), and P10 (3P) recoverable reserves.
                </p>
                <div className="chart-holder">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={results.prmsRes.probabilityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <XAxis
                        dataKey="exceedancePct"
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Probability of Exceedance', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 11 }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        stroke="#9ca3af"
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        label={{ value: 'Reserves (Bscf)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="reservesBscf"
                        name="Recoverable Reserves (Bscf)"
                        stroke="#111827"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#111827' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CollapsibleSection>
            </div>

            <motion.div
              className="bottom-action"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
            >
              <motion.button
                type="button"
                onClick={handleBackToForm}
                className="submit-btn"
                whileTap={{ scale: 0.99 }}
              >
                Modify Reservoir Parameters
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default App
