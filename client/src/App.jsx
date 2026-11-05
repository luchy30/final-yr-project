import { useState } from 'react'
import './App.css'

function App() {
  const [area, setArea] = useState('640')
  const [thickness, setThickness] = useState('45')
  const [porosity, setPorosity] = useState('0.18')
  const [waterSat, setWaterSat] = useState('0.25')
  const [pressure, setPressure] = useState('3200')
  const [temperature, setTemperature] = useState('180')
  const [gasGravity, setGasGravity] = useState('0.65')

  const [results, setResults] = useState(null)

  const handleCalculate = (e) => {
    e.preventDefault()

    const a = parseFloat(area) || 0
    const h = parseFloat(thickness) || 0
    const phi = parseFloat(porosity) || 0
    const sw = parseFloat(waterSat) || 0
    const p = parseFloat(pressure) || 0
    const tempF = parseFloat(temperature) || 0
    const gg = parseFloat(gasGravity) || 0

    const tempR = tempF + 459.67

    // Pseudo-critical properties
    const ppc = 756.8 - 131.0 * gg - 3.6 * gg * gg
    const tpc = 169.2 + 349.5 * gg - 74.0 * gg * gg

    const ppr = ppc > 0 ? p / ppc : 1
    const tpr = tpc > 0 ? tempR / tpc : 1

    // Gas deviation factor approximation
    const z = Math.max(0.7, 1 - (3.52 * ppr) / Math.pow(10, 0.9813 * tpr) + (0.274 * ppr * ppr) / Math.pow(10, 0.8157 * tpr))

    // Formation volume factor Bgi in cu ft / scf
    const bgi = p > 0 ? (0.02827 * z * tempR) / p : 0.005

    // GIIP in Billion Standard Cubic Feet (Bscf)
    const giipScf = bgi > 0 ? (43560 * a * h * phi * (1 - sw)) / bgi : 0
    const giipBscf = giipScf / 1e9

    setResults({
      zFactor: z.toFixed(4),
      giip: giipBscf.toFixed(2),
      reserve1p: (giipBscf * 0.65).toFixed(2),
      reserve2p: (giipBscf * 0.75).toFixed(2),
      reserve3p: (giipBscf * 0.85).toFixed(2),
    })
  }

  return (
    <main className="center-container">
      <div className="content-wrap">
        <header className="intro-block">
          <h1>Gas Reserves Estimation</h1>
          <p>Enter your reservoir parameters below to calculate gas in place and reserves.</p>
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
            <button type="submit" className="submit-btn">
              Calculate Reserves
            </button>
          </div>
        </form>

        {results && (
          <section className="results-block">
            <h2>Calculated Results</h2>

            <div className="result-row">
              <span className="result-name">Predicted Z Factor</span>
              <span className="result-val">{results.zFactor}</span>
            </div>

            <div className="result-row">
              <span className="result-name">Gas Initially in Place</span>
              <span className="result-val">{results.giip} Bscf</span>
            </div>

            <div className="result-row">
              <span className="result-name">1P Proved Reserves</span>
              <span className="result-val">{results.reserve1p} Bscf</span>
            </div>

            <div className="result-row">
              <span className="result-name">2P Probable Reserves</span>
              <span className="result-val">{results.reserve2p} Bscf</span>
            </div>

            <div className="result-row">
              <span className="result-name">3P Possible Reserves</span>
              <span className="result-val">{results.reserve3p} Bscf</span>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
