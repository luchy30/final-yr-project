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

    // 1. Fluid classification (Section 3.1)
    const classification = classifyReservoirFluid({
      gorScfStb: gorVal,
      apiGravity: apiVal,
      reservoirTempF: tempF,
      dewPointPsia: 0,
      initialPressurePsia: pi,
    })

    // 2. Pseudo-critical & Z-factor calculations at Pi and Pa (Section 3.2)
    const initialReduced = calcPseudoReduced(pi, tempF, gg, 'chapter3')
    const zBrillBeggsInitial = calcBrillBeggsZ(initialReduced.ppr, initialReduced.tpr)
    const zHallYarboroughInitial = calcHallYarboroughZ(initialReduced.ppr, initialReduced.tpr)
    const zDakInitial = calcDranchukAbouKassemZ(initialReduced.ppr, initialReduced.tpr)

    const zi = computeZByMethod(pi, tempF, gg, zMethod)
    const za = computeZByMethod(pa, tempF, gg, zMethod)

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

    // 3. Volumetric Reserves (Section 3.4)
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

    // 4. Wet Gas & Condensate Equivalent Properties (Section 3.3)
    const wetProps = calcWetGasProperties({
      gorScfStb: gorVal,
      apiGravity: apiVal,
      surfaceGasGravity: gg,
      wellStreamGasInPlaceScf: volRes.giipScf,
    })

    // 5. Water Influx & Material Balance (Sections 3.5, 3.6, 3.7)
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
      gasGravity: gg,
      initialWaterSat: swi,
      aquiferModel,
      driveMechanism,
      calcZFunc: (pVal) => computeZByMethod(pVal, tempF, gg, zMethod),
      calcBgFunc: (pVal, zVal) =>
        calcBg({ pressurePsia: pVal, tempR: initialReduced.tempR, zFactor: zVal }),
      aquiferProps,
    })

    // 6. Z-Factor vs Pressure Curve across all 3 correlations
    const zCurve = []
    const maxP = Math.max(pi, 4500)
    for (let testP = 500; testP <= maxP; testP += 500) {
      const red = calcPseudoReduced(testP, tempF, gg, 'chapter3')
      zCurve.push({
        pressure: testP,
        brillBeggs: Number(calcBrillBeggsZ(red.ppr, red.tpr).toFixed(4)),
        hallYarborough: Number(calcHallYarboroughZ(red.ppr, red.tpr).toFixed(4)),
        dak: Number(calcDranchukAbouKassemZ(red.ppr, red.tpr).toFixed(4)),
      })
    }

    // 7. Arps Decline Curve Analysis (Section 3.8)
    const dcaRes = calcArpsDecline({
      initialRateMscfDay: initialRate,
      nominalDeclinePerMonth: declineRate,
      hyperbolicExponentB: arpsB,
      economicLimitMscfDay: economicLimit,
      forecastMonths: 36,
    })

    // 8. PRMS 1P, 2P, 3P Monte Carlo & Method Recommendation (Sections 3.6 & 3.7)
    const prmsRes = calcPRMSReserves({
      areaAcres: a,
      netPayFeet: h,
      porosity: phi,
      initialWaterSat: swi,
      bgiCuftScf: bgiCuft,
      activeRf: volRes.activeRf,
    })

    const recommendation = recommendMethodAndMechanism({
      fluidType: classification.fluidType,
      driveMechanism,
      fieldStage,
    })

    setResults({
      classification,
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
                Enter reservoir, fluid, aquifer, and decline parameters to run the Chapter Three estimation models.
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

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              <h2>Fluid Classification and Method Recommendation</h2>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Reservoir Fluid Type</span>
                  <span className="data-value">{results.classification.fluidType}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Assigned Reservoir Class</span>
                  <span className="data-value">{results.recommendation.reservoirClass}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Recommended Method</span>
                  <span className="data-value">{results.recommendation.recommendedMethod}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Gas Equivalent of Condensate (GE)</span>
                  <span className="data-value">{results.wetProps.gasEquivalentGE.toFixed(0)} scf/STB</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Well-Stream Specific Gravity</span>
                  <span className="data-value">{results.wetProps.wellStreamGravity.toFixed(4)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Initial Condensate in Place (Nc)</span>
                  <span className="data-value">{(results.wetProps.initialCondensateInPlaceStb / 1e6).toFixed(2)} MMSTB</span>
                </div>
              </div>
              <p className="diagnostic-note">{results.recommendation.evidence}</p>
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <h2>Gas Properties and Z-Factor Correlations at Initial Conditions</h2>
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
                  <span className="data-label">Initial Bgi (Eq. 3.1)</span>
                  <span className="data-value">{results.bgiCuft} ft3/scf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Initial Bgi (Eq. 3.2)</span>
                  <span className="data-value">{results.bgiRb} rb/scf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Abandonment Bga</span>
                  <span className="data-value">{results.bgaCuft} ft3/scf</span>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16 }}
            >
              <h2>Volumetric, Material Balance, and PRMS Reserves</h2>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Original Gas in Place (G)</span>
                  <span className="data-value">{results.volRes.giipBscf.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Volumetric Recovery Factor (Eq. 3.12)</span>
                  <span className="data-value">{(results.volRes.rfVolumetric * 100).toFixed(1)}%</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Water-Drive Recovery Factor (Eq. 3.13)</span>
                  <span className="data-value">{(results.volRes.rfWaterDrive * 100).toFixed(1)}%</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Ultimate Recoverable Gas (EUR)</span>
                  <span className="data-value">{results.volRes.ultimateRecoveryBscf.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">1P Proved Reserves (P90)</span>
                  <span className="data-value">{results.prmsRes.reserve1P} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">2P Probable Reserves (P50)</span>
                  <span className="data-value">{results.prmsRes.reserve2P} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">3P Possible Reserves (P10)</span>
                  <span className="data-value">{results.prmsRes.reserve3P} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Initial pi/zi Intercept</span>
                  <span className="data-value">{results.volRes.piOverZi.toFixed(0)} psia</span>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <h2>Reservoir Drive Energy Indices and Aquifer Influx (Sections 3.6 and 3.7)</h2>
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
                  <span className="data-label">Drive Index Sum Check (Eq. 3.57)</span>
                  <span className="data-value">{results.mbeRes.driveSum.toFixed(3)}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Cumulative Water Influx (We)</span>
                  <span className="data-value">{(results.mbeRes.cumulativeWeBbl / 1e6).toFixed(2)} MMbbl</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Arps Hyperbolic EUR (Eq. 3.73)</span>
                  <span className="data-value">{results.dcaRes.eurHyperbolicBscf.toFixed(2)} Bscf</span>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 }}
            >
              <h2>Material Balance: p/z vs Cumulative Gas Production (Figure 3.1)</h2>
              <p className="chart-desc">
                Comparison of linear volumetric depletion (Eq. 3.17) against water-drive pressure support curvature (Eq. 3.30).
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
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28 }}
            >
              <h2>Z-Factor Correlations Across Pressure (Section 3.2.1 and 3.4.1)</h2>
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
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.32 }}
            >
              <h2>Cole Diagnostic Plot: Apparent GIIP (F/Eg) vs Gp (Section 3.5.4)</h2>
              <p className="chart-desc">
                For a volumetric reservoir, F/Eg remains flat at true G. An upward trend indicates active water influx (Eq. 3.52).
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
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.36 }}
            >
              <h2>Arps Decline Curve Analysis: Exponential, Hyperbolic, and Harmonic (Section 3.8)</h2>
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
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.4 }}
            >
              <h2>PRMS Probabilistic Reserves Exceedance Curve (Section 3.6)</h2>
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
            </motion.section>

            <motion.div
              className="bottom-action"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.44 }}
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
