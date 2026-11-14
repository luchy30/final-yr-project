import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useReservoir } from '../context/useReservoir'
import CustomSelect from '../components/CustomSelect'

export function CalculationsPage() {
  const navigate = useNavigate()
  const {
    activeProject,
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
    handleCalculate,
    resetProjectDefaults,
  } = useReservoir()

  const onSubmit = (e) => {
    e.preventDefault()
    handleCalculate()
    navigate('/results')
  }

  return (
    <motion.div
      key={`calculations-page-${activeProject.id}`}
      className="form-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ marginBottom: '2.25rem' }}>
        <h2 className="form-block-heading" style={{ marginTop: 0 }}>
          Reservoir Parameters and Calculation Setup
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Editing workspace inputs for {activeProject.name}. Changes are saved per project.
        </p>
      </div>

      <form onSubmit={onSubmit}>
        {/* Section 1: Petrophysics and Reservoir Geometry */}
        <div style={{ marginBottom: '2.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 1.25rem 0' }}>
            Petrophysical and Geometry Inputs
          </h3>
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
              <label htmlFor="thickness">Net Pay Thickness h (ft)</label>
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
              <label htmlFor="porosity">Average Porosity (fraction)</label>
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
        </div>

        {/* Section 2: Fluid Properties and Reservoir Pressures */}
        <div style={{ marginBottom: '2.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 1.25rem 0' }}>
            Fluid and Pressure Inputs
          </h3>
          <div className="form-columns-grid">
            <div className="input-cell">
              <label htmlFor="pressure">Initial Pressure Pi (psia)</label>
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
              <label htmlFor="abandonmentPressure">Abandonment Pressure Pa (psia)</label>
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
              <label htmlFor="temperature">Reservoir Temperature (deg F)</label>
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
              <label htmlFor="gasGravity">Surface Gas Gravity (air = 1.0)</label>
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
              <label htmlFor="gor">Initial Gas Oil Ratio GOR (scf/STB)</label>
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
              <label htmlFor="apiGravity">Condensate Gravity (deg API)</label>
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
          </div>
        </div>

        {/* Section 3: Correlation Choices */}
        <div style={{ marginBottom: '2.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 1.25rem 0' }}>
            Empirical Correlations and Fluid Classification
          </h3>
          <div className="form-columns-grid">
            <div className="input-cell">
              <label htmlFor="zMethod">Gas Deviation Z Factor Correlation</label>
              <CustomSelect
                id="zMethod"
                value={zMethod}
                onChange={setZMethod}
                options={[
                  { value: 'hall_yarborough', label: 'Hall and Yarborough EOS' },
                  { value: 'brill_beggs', label: 'Brill and Beggs Empirical' },
                  { value: 'dak', label: 'Dranchuk and Abou-Kassem EOS' },
                ]}
              />
            </div>

            <div className="input-cell">
              <label htmlFor="pseudoMethod">Pseudo-Critical Properties Method</label>
              <CustomSelect
                id="pseudoMethod"
                value={pseudoMethod}
                onChange={setPseudoMethod}
                options={[
                  { value: 'chapter3', label: 'Methodology Correlation (Tpc = 170.491 + 307.344 yg)' },
                  { value: 'standing', label: 'Standing Standard Correlation' },
                  { value: 'sutton', label: 'Sutton Extended Correlation' },
                ]}
              />
            </div>

            <div className="input-cell">
              <label htmlFor="classificationCriterion">Fluid Classification Criterion</label>
              <CustomSelect
                id="classificationCriterion"
                value={classificationCriterion}
                onChange={setClassificationCriterion}
                options={[
                  { value: 'ahmed', label: 'Ahmed Criterion (2019 Table 3.1)' },
                  { value: 'mccain', label: 'McCain Criterion (1990 Table 3.1)' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Drive Mechanism, Aquifer and Decline Settings */}
        <div style={{ marginBottom: '2.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 1.25rem 0' }}>
            Reservoir Drive, Aquifer, and Production Forecast
          </h3>
          <div className="form-columns-grid">
            <div className="input-cell">
              <label htmlFor="fieldStage">Field Development Stage</label>
              <CustomSelect
                id="fieldStage"
                value={fieldStage}
                onChange={setFieldStage}
                options={[
                  { value: 'early', label: 'Early Appraisal (Volumetric EUR)' },
                  { value: 'producing', label: 'Producing Field (Material Balance EUR)' },
                  { value: 'mature', label: 'Mature Field (Decline Curve EUR)' },
                ]}
              />
            </div>

            <div className="input-cell">
              <label htmlFor="driveMechanism">Primary Drive Mechanism</label>
              <CustomSelect
                id="driveMechanism"
                value={driveMechanism}
                onChange={setDriveMechanism}
                options={[
                  { value: 'volumetric', label: 'Volumetric Depletion' },
                  { value: 'water_drive', label: 'Water Drive' },
                  { value: 'combination', label: 'Combination Drive' },
                ]}
              />
            </div>

            <div className="input-cell">
              <label htmlFor="aquiferModel">Aquifer Influx Model</label>
              <CustomSelect
                id="aquiferModel"
                value={aquiferModel}
                onChange={setAquiferModel}
                options={[
                  { value: 'pot', label: 'Pot Aquifer Model' },
                  { value: 'schilthuis', label: 'Schilthuis Steady-State Model' },
                ]}
              />
            </div>

            <div className="input-cell">
              <label htmlFor="declineModel">Arps Decline Model</label>
              <CustomSelect
                id="declineModel"
                value={declineModel}
                onChange={setDeclineModel}
                options={[
                  { value: 'hyperbolic', label: 'Hyperbolic Decline' },
                  { value: 'exponential', label: 'Exponential Decline' },
                  { value: 'harmonic', label: 'Harmonic Decline' },
                ]}
              />
            </div>

            <div className="input-cell">
              <label htmlFor="initialRate">Initial Rate qi (Mscf/day)</label>
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
              <label htmlFor="declineRate">Nominal Decline Rate Di (monthly fraction)</label>
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
              <label htmlFor="arpsB">Arps Exponent b</label>
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
        </div>

        {/* Action Buttons */}
        <div className="form-actions-row">
          <button
            type="submit"
            className="primary-submit-btn"
          >
            Compute Reserves and View Analysis
          </button>
          <button
            type="button"
            onClick={resetProjectDefaults}
            className="secondary-action-btn"
          >
            Reset Defaults
          </button>
        </div>
      </form>
    </motion.div>
  )
}
