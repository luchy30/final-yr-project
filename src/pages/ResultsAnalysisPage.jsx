import { useState } from 'react'
import { motion } from 'framer-motion'
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
import { useReservoir } from '../context/ReservoirContext'
import { CollapsibleSection } from '../components/CollapsibleSection'

export function ResultsAnalysisPage() {
  const {
    results,
    getZMethodLabel,
    driveIndicesData,
    chartThemeStyles,
    activeChartTab,
    setActiveChartTab,
  } = useReservoir()

  const [activeSection, setActiveSection] = useState(0)

  const toggleSection = (index) => {
    setActiveSection((prev) => (prev === index ? -1 : index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Visual Result Cards Grid */}
      <motion.div
        key="results-grid"
        className="dashboard-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Top Left Card: Primary Engineering KPI Matrix */}
        <div className="grid-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Reserves Overview</h3>
              <div className="card-subtitle">Volumetric and material balance summary</div>
            </div>
          </div>

          <div className="kpi-quad-grid">
            <div className="kpi-cell">
              <span className="kpi-label">Original Gas in Place</span>
              <div className="kpi-number">{results.volRes.giipBscf.toFixed(2)}</div>
              <span className="kpi-context">Bscf at initial reservoir pressure</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Ultimate Recovery EUR</span>
              <div className="kpi-number">{results.recommendation.finalRecommendedEurBscf.toFixed(2)}</div>
              <span className="kpi-context">Bscf recommended technical recovery</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Recovery Factor</span>
              <div className="kpi-number">{(results.volRes.activeRf * 100).toFixed(1)}%</div>
              <span className="kpi-context">Drive mechanism efficiency</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Initial Z Factor</span>
              <div className="kpi-number">{results.zi}</div>
              <span className="kpi-context">{getZMethodLabel(results.activeZMethod)}</span>
            </div>
          </div>
        </div>

        {/* Top Right Card: Correlation Comparison Matrix Across Pressure Stages */}
        <div className="grid-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Z Factor by Pressure</h3>
              <div className="card-subtitle">Correlation comparison across depletion path</div>
            </div>
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
                      className={isSelected ? 'matrix-cell primary-match' : 'matrix-cell'}
                    >
                      {val}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="matrix-legend">
            <span className="matrix-legend-item">Pseudocritical: {results.activePseudoMethod}</span>
            <span className="matrix-legend-item">Effective Gravity: {results.effectiveGasGravity}</span>
          </div>
        </div>

        {/* Bottom Left Card: Main Chart with Tab Switcher */}
        <div className="grid-card large-chart-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Reservoir Depletion Curves</h3>
              <div className="card-subtitle">Material balance and decline trend monitoring</div>
            </div>

            <div className="tab-selector-bar">
              <button
                type="button"
                onClick={() => setActiveChartTab('pz')}
                className={activeChartTab === 'pz' ? 'tab-pill active' : 'tab-pill'}
              >
                p/z Plot
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('zcurve')}
                className={activeChartTab === 'zcurve' ? 'tab-pill active' : 'tab-pill'}
              >
                Z Factor
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('cole')}
                className={activeChartTab === 'cole' ? 'tab-pill active' : 'tab-pill'}
              >
                Cole Plot
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('dca')}
                className={activeChartTab === 'dca' ? 'tab-pill active' : 'tab-pill'}
              >
                Arps DCA
              </button>
              <button
                type="button"
                onClick={() => setActiveChartTab('prms')}
                className={activeChartTab === 'prms' ? 'tab-pill active' : 'tab-pill'}
              >
                PRMS P90/P10
              </button>
            </div>
          </div>

          <div className="chart-canvas-area">
            {activeChartTab === 'pz' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.mbeRes.pzComparisonCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <XAxis dataKey="gp" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="volumetricPz" name="Volumetric (Straight Line)" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={{ r: 2, fill: chartThemeStyles.contrastLine }} />
                  <Line type="monotone" dataKey="waterDrivePz" name="Water Drive (Aquifer Support)" stroke="#059669" strokeWidth={2} dot={{ r: 2, fill: '#059669' }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'zcurve' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.zCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <XAxis dataKey="pressure" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis domain={['auto', 'auto']} stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="hallYarborough" name="Hall-Yarborough" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="brillBeggs" name="Brill-Beggs" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dak" name="Dranchuk-Abou-Kassem" stroke="#34d399" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'cole' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.mbeRes.havlenaOdehPoints} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <XAxis dataKey="gpBscf" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Line type="monotone" dataKey="coleApparentGBscf" name="Apparent GIIP F/Eg (Bscf)" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'dca' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.dcaRes.dcaCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <XAxis dataKey="month" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="hyperbolicRate" name="Hyperbolic" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="exponentialRate" name="Exponential" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="harmonicRate" name="Harmonic" stroke="#9ca3af" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'prms' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.prmsRes.probabilityCurve} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <XAxis dataKey="exceedancePct" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Line type="monotone" dataKey="reservesBscf" name="Recoverable Reserves (Bscf)" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom Right Card: Donut Breakdown for Drive Energy Indices */}
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

      {/* Detailed Evaluation Accordions */}
      <motion.div
        key="detailed-eval"
        className="form-view-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className="form-block-heading" style={{ marginTop: 0 }}>
            Detailed Engineering Results
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Expand each section below to inspect fluid classification, PRMS distributions, and material balance indices.
          </p>
        </div>

        <div className="collapsible-group">
          <CollapsibleSection
            index={0}
            title="Reservoir Fluid Classification and Condensate Properties"
            isOpen={activeSection === 0}
            onToggle={toggleSection}
            delay={0.05}
          >
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Identified Fluid Type</span>
                <span className="data-value highlight">{results.classification.fluidType}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Initial Gas Oil Ratio GOR</span>
                <span className="data-value">{results.classification.gorScfStb.toLocaleString()} scf/STB</span>
              </div>
              <div className="data-item">
                <span className="data-label">Stock Tank Liquid Gravity</span>
                <span className="data-value">{results.classification.apiGravity} deg API</span>
              </div>
              <div className="data-item">
                <span className="data-label">Wellstream Specific Gravity</span>
                <span className="data-value">{results.effectiveGasGravity}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Condensate Yield</span>
                <span className="data-value">{results.wetProps.condensateYieldStbMmscf.toFixed(2)} STB/MMscf</span>
              </div>
              <div className="data-item">
                <span className="data-label">Initial Condensate in Place</span>
                <span className="data-value">{(results.wetProps.condensateInPlaceStb / 1e6).toFixed(2)} MMSTB</span>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            index={1}
            title="PRMS Reserves Classification and Probabilistic Distribution"
            isOpen={activeSection === 1}
            onToggle={toggleSection}
            delay={0.08}
          >
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">1P Proved Reserves (P90)</span>
                <span className="data-value">{results.prmsRes.reserve1P.toFixed(2)} Bscf</span>
              </div>
              <div className="data-item">
                <span className="data-label">2P Proved plus Probable (P50)</span>
                <span className="data-value highlight">{results.prmsRes.reserve2P.toFixed(2)} Bscf</span>
              </div>
              <div className="data-item">
                <span className="data-label">3P Possible Reserves (P10)</span>
                <span className="data-value">{results.prmsRes.reserve3P.toFixed(2)} Bscf</span>
              </div>
              <div className="data-item">
                <span className="data-label">Recommended Deterministic EUR</span>
                <span className="data-value">{results.recommendation.finalRecommendedEurBscf.toFixed(2)} Bscf</span>
              </div>
              <div className="data-item">
                <span className="data-label">Method Confidence Category</span>
                <span className="data-value">{results.recommendation.confidence}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Reservoir Geological Class</span>
                <span className="data-value">{results.recommendation.reservoirClass}</span>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            index={2}
            title="Gas Deviation Factor (Z) and Real Gas Properties"
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
                <span className="data-label">Initial Z Factor (zi)</span>
                <span className="data-value">{results.zi}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Abandonment Z Factor (za)</span>
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
            title="Volumetric and Material Balance Indices"
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
                <span className="data-label">Volumetric Recovery Factor</span>
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
    </div>
  )
}
