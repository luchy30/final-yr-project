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
import './App.css'

function App() {
  const [area, setArea] = useState('640')
  const [thickness, setThickness] = useState('45')
  const [porosity, setPorosity] = useState('0.18')
  const [waterSat, setWaterSat] = useState('0.25')
  const [pressure, setPressure] = useState('3200')
  const [temperature, setTemperature] = useState('180')
  const [gasGravity, setGasGravity] = useState('0.65')

  const [currentView, setCurrentView] = useState('form')
  const [results, setResults] = useState(null)

  const handleCalculate = (e) => {
    e.preventDefault()

    const a = parseFloat(area) ? parseFloat(area) : 0
    const h = parseFloat(thickness) ? parseFloat(thickness) : 0
    const phi = parseFloat(porosity) ? parseFloat(porosity) : 0
    const sw = parseFloat(waterSat) ? parseFloat(waterSat) : 0
    const p = parseFloat(pressure) ? parseFloat(pressure) : 0
    const tempF = parseFloat(temperature) ? parseFloat(temperature) : 0
    const gg = parseFloat(gasGravity) ? parseFloat(gasGravity) : 0

    const tempR = tempF + 459.67

    // Sutton pseudo-critical properties
    const ppc = 756.8 - 131.0 * gg - 3.6 * gg * gg
    const tpc = 169.2 + 349.5 * gg - 74.0 * gg * gg

    const tpr = tpc > 0 ? tempR / tpc : 1

    // Papay explicit Z-factor correlation
    const calcPapayZ = (currP) => {
      const currPpr = ppc > 0 ? currP / ppc : 1
      const zVal =
        1 -
        (3.52 * currPpr) / Math.pow(10, 0.9813 * tpr) +
        (0.274 * currPpr * currPpr) / Math.pow(10, 0.8157 * tpr)
      return Math.max(0.5, zVal)
    }

    // Hall-Yarborough iterative Z-factor correlation
    const calcHallYarboroughZ = (currP) => {
      const currPpr = ppc > 0 ? currP / ppc : 1
      const t = tpr > 0 ? 1 / tpr : 1
      const X1 = -0.06125 * currPpr * t * Math.exp(-1.2 * Math.pow(1 - t, 2))
      const X2 = 14.76 * t - 9.76 * t * t + 4.58 * t * t * t
      const X3 = 90.7 * t - 242.2 * t * t + 42.4 * t * t * t
      const X4 = 2.18 + 2.82 * t

      let y = 0.0125 * currPpr * t * Math.exp(-1.2 * Math.pow(1 - t, 2))
      for (let iter = 0; iter < 25; iter++) {
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
      const zVal = y > 0 ? -X1 / y : 1
      return Math.max(0.5, zVal)
    }

    const z = calcHallYarboroughZ(p)
    const bgi = p > 0 ? (0.02827 * z * tempR) / p : 0.005

    // GIIP in Billion Standard Cubic Feet (Bscf)
    const giipScf = bgi > 0 ? (43560 * a * h * phi * (1 - sw)) / bgi : 0
    const giipBscf = giipScf / 1e9

    // Material Balance P/Z curve data
    const pOverZInitial = z > 0 ? p / z : 0
    const pzCurve = []
    const steps = 6
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps
      const gp = Number((giipBscf * frac).toFixed(2))
      const pzVal = Number((pOverZInitial * (1 - frac)).toFixed(1))
      pzCurve.push({ gp, pz: pzVal })
    }

    // Z-factor vs Pressure curve data (Hall-Yarborough vs Papay)
    const zCurve = []
    const maxP = Math.max(p, 4500)
    for (let testP = 500; testP <= maxP; testP += 500) {
      const hyZ = calcHallYarboroughZ(testP)
      const papayZ = calcPapayZ(testP)
      zCurve.push({
        pressure: testP,
        hallYarborough: Number(hyZ.toFixed(4)),
        papay: Number(papayZ.toFixed(4)),
      })
    }

    // Decline curve analysis data (monthly forecast)
    const dcaCurve = []
    const initialRate = Math.max(500, Math.round(giipBscf * 180))
    const monthlyDecline = 0.02
    for (let month = 1; month <= 24; month++) {
      const rate = Math.round(initialRate * Math.exp(-monthlyDecline * month))
      dcaCurve.push({ month, rate })
    }

    setResults({
      inputs: { area: a, thickness: h, porosity: phi, waterSat: sw, pressure: p, temperature: tempF, gasGravity: gg },
      zFactor: z.toFixed(4),
      bgi: bgi.toFixed(5),
      giip: giipBscf.toFixed(2),
      reserve1p: (giipBscf * 0.65).toFixed(2),
      reserve2p: (giipBscf * 0.75).toFixed(2),
      reserve3p: (giipBscf * 0.85).toFixed(2),
      pzInitial: Math.round(pOverZInitial),
      pzCurve,
      zCurve,
      dcaCurve,
      recommendedDrive: 'Volumetric Depletion Drive',
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
              <p>Enter your reservoir parameters below to predict the Z-factor and calculate gas reserves.</p>
            </header>

            <form onSubmit={handleCalculate} className="form-stack">
              <div className="field-group">
                <label htmlFor="area">Reservoir Area (acres)</label>
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
                <label htmlFor="thickness">Net Pay Thickness (feet)</label>
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
                <label htmlFor="porosity">Porosity (fraction)</label>
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
                <label htmlFor="waterSat">Water Saturation (fraction)</label>
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
                <label htmlFor="pressure">Reservoir Pressure (psia)</label>
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
                <label htmlFor="temperature">Reservoir Temperature (Fahrenheit)</label>
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

              <div className="button-group">
                <motion.button
                  type="submit"
                  className="submit-btn"
                  whileTap={{ scale: 0.99 }}
                >
                  Calculate Reserves
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
              <h1>Processed Reservoir Data</h1>
              <p>Calculated Z-factor, gas initially in place, recovery classifications, and analytical curves.</p>
            </motion.header>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <h2>Reserves Summary</h2>
              <div className="data-grid">
                <div className="data-item">
                  <span className="data-label">Gas Initially in Place (GIIP)</span>
                  <span className="data-value">{results.giip} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">1P Proved Reserves</span>
                  <span className="data-value">{results.reserve1p} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">2P Probable Reserves</span>
                  <span className="data-value">{results.reserve2p} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">3P Possible Reserves</span>
                  <span className="data-value">{results.reserve3p} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Predicted Z Factor</span>
                  <span className="data-value">{results.zFactor}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Initial P/Z</span>
                  <span className="data-value">{results.pzInitial} psia</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Formation Volume Factor (Bgi)</span>
                  <span className="data-value">{results.bgi} cu ft/scf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Recommended Mechanism</span>
                  <span className="data-value">{results.recommendedDrive}</span>
                </div>
              </div>
            </motion.section>

            <motion.section
              className="section-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              <h2>Material Balance: P/Z vs Cumulative Production</h2>
              <p className="chart-desc">Extrapolation of reservoir pressure decline against cumulative gas production to determine ultimate recovery.</p>
              <div className="chart-holder">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={results.pzCurve} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
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
                      label={{ value: 'P/Z (psia)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pz"
                      name="P/Z"
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
              transition={{ duration: 0.45, delay: 0.26 }}
            >
              <h2>Z-Factor Prediction Across Pressure</h2>
              <p className="chart-desc">Comparison between the iterative Hall-Yarborough equation of state and the explicit Papay correlation.</p>
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
                      dataKey="papay"
                      name="Papay Correlation"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="hallYarborough"
                      name="Hall-Yarborough Correlation"
                      stroke="#111827"
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
              transition={{ duration: 0.45, delay: 0.34 }}
            >
              <h2>Decline Curve Analysis: Forecasted Production</h2>
              <p className="chart-desc">Estimated gas production rate decline over 24 months based on initial deliverability.</p>
              <div className="chart-holder">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={results.dcaCurve} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
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
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Gas Production Rate"
                      stroke="#111827"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            <motion.div
              className="bottom-action"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
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
