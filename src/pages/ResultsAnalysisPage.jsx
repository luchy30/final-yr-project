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
import { useReservoir } from '../context/useReservoir'
import { useAuth } from '../context/useAuth'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { StudentAccessGate } from '../components/StudentAccessGate'

const RESERVE_CLASS_TABS = [
  { id: 'proved', label: 'Proved (1P)' },
  { id: 'probable', label: 'Probable (2P)' },
  { id: 'possible', label: 'Possible (3P)' },
]

const FORECAST_SCENARIO_TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'proved', label: '1P (P90)' },
  { id: 'probable', label: '2P Midcase (P50)' },
  { id: 'possible', label: '3P (P10)' },
]

export function ResultsAnalysisPage() {
  const {
    activeProject,
    results,
    getZMethodLabel,
    driveIndicesData,
    chartThemeStyles,
    activeChartTab,
    setActiveChartTab,
    searchQuery,
  } = useReservoir()
  const { isGuest } = useAuth()

  const [activeSection, setActiveSection] = useState(0)
  const [activeReserveClass, setActiveReserveClass] = useState('proved')
  const [activeForecastScenario, setActiveForecastScenario] = useState('recommended')

  const effectiveForecastScenario = isGuest ? 'recommended' : activeForecastScenario
  const activeForecast =
    results.forecastScenarios?.[effectiveForecastScenario] || results.forecastRes

  const toggleSection = (index) => {
    setActiveSection((prev) => (prev === index ? -1 : index))
  }

  const aquiferDisplayName =
    results.activeAquiferModel === 'schilthuis'
      ? 'Schilthuis Steady-State Model'
      : 'Pot Aquifer Model'

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const sectionMatches = (text) => {
    if (!normalizedQuery) return true
    return text.toLowerCase().includes(normalizedQuery)
  }

  const giip = results.volRes.giipBscf
  const pctOfGiip = (val) => (giip > 0 ? ((val / giip) * 100).toFixed(1) : '0.0')

  const reserveClassViews = {
    proved: {
      subtitle: 'P90 high-certainty proved recoverable gas estimate (1P)',
      metrics: [
        {
          label: 'Proved Reserves (1P)',
          value: `${results.prmsRes.reserve1P.toFixed(2)} Bscf`,
          context: 'Conservative threshold with reasonable certainty',
        },
        {
          label: 'Probability Threshold',
          value: 'P90 (90%)',
          context: '90% probability recovered volume equals or exceeds 1P',
        },
        {
          label: 'Recovery of Initial GIIP',
          value: `${pctOfGiip(results.prmsRes.reserve1P)}%`,
          context: `Share of ${giip.toFixed(2)} Bscf original gas in place`,
        },
        {
          label: 'Evaluation Basis',
          value: results.recommendation.reservoirClass.split(':')[0],
          context: results.recommendation.confidence,
        },
      ],
    },
    probable: {
      subtitle: 'Unrisked probable upside and P50 best estimate cumulative reserves (2P)',
      metrics: [
        {
          label: 'Incremental Probable',
          value: `+${results.prmsRes.probableIncrementalBscf.toFixed(2)} Bscf`,
          context: 'Additional probable volume above 1P Proved',
        },
        {
          label: 'Cumulative 2P Reserves (P50)',
          value: `${results.prmsRes.reserve2P.toFixed(2)} Bscf`,
          context: `Proved + Probable matched to ${results.recommendation.recommendedMethod}`,
        },
        {
          label: 'Probability Threshold',
          value: 'P50 (50%)',
          context: `${pctOfGiip(results.prmsRes.reserve2P)}% of initial GIIP recovered`,
        },
        {
          label: 'Uncertainty Parameter Spread',
          value: `+/- ${(results.recommendation.uncertaintySpread * 100).toFixed(0)}%`,
          context: `${results.classification.fluidType} volumetric spread`,
        },
      ],
    },
    possible: {
      subtitle: 'High-side possible upside and P10 total resource envelope (3P)',
      metrics: [
        {
          label: 'Incremental Possible',
          value: `+${results.prmsRes.possibleIncrementalBscf.toFixed(2)} Bscf`,
          context: 'Upside possible volume above 2P Probable',
        },
        {
          label: 'Cumulative 3P Reserves (P10)',
          value: `${results.prmsRes.reserve3P.toFixed(2)} Bscf`,
          context: 'Proved + Probable + Possible high estimate',
        },
        {
          label: 'Probability Threshold',
          value: 'P10 (10%)',
          context: `${pctOfGiip(results.prmsRes.reserve3P)}% of initial GIIP recovered`,
        },
        {
          label: 'Total 1P to 3P Span',
          value: `${results.prmsRes.uncertaintySpanBscf.toFixed(2)} Bscf`,
          context: results.recommendation.spreadDescription,
        },
      ],
    },
  }

  const activeReserveView = reserveClassViews[activeReserveClass]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Visual Result Cards Grid */}
      <motion.div
        key={`results-grid-${activeProject.id}`}
        className="dashboard-grid"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Top Left Card: Primary Engineering KPI Matrix */}
        <div className="grid-card overview-kpi-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Reserves Overview</h3>
              <div className="card-subtitle">Volumetric, material balance, and depletion summary</div>
            </div>
          </div>

          <div className="kpi-matrix">
            <div className="kpi-cell">
              <span className="kpi-label">Original Gas in Place</span>
              <div className="kpi-number">{results.volRes.giipBscf.toFixed(2)}</div>
              <span className="kpi-context">Bscf at initial reservoir pressure</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Ultimate Recovery EUR</span>
              <div className="kpi-number">{results.recommendation.finalRecommendedEurBscf.toFixed(2)}</div>
              <span className="kpi-context">
                Bscf ({(results.volRes.activeRf * 100).toFixed(1)}% recovery factor)
              </span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Calculated Economic Limit (qa)</span>
              <div className="kpi-number">{results.forecastRes.qaMscfDay.toLocaleString()}</div>
              <span className="kpi-context">Mscf/day abandonment cutoff at Pa</span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Cumulative Water Influx (We)</span>
              <div className="kpi-number">
                {(results.mbeRes.activeWeBbl / 1e6).toFixed(2)} MMbbl
              </div>
              <span className="kpi-context">
                {results.mbeRes.activeWeBbl > 0
                  ? `${aquiferDisplayName} (Active drive)`
                  : `Aquifer potential: ${(results.mbeRes.aquiferPotentialWeBbl / 1e6).toFixed(2)} MMbbl`}
              </span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Estimated Depletion Time</span>
              <div className="kpi-number">{results.forecastRes.yearsToDeplete.toFixed(1)} yrs</div>
              <span className="kpi-context">
                {results.forecastRes.monthsToDeplete.toFixed(0)} months at {results.forecastRes.qiMscfDay.toLocaleString()} Mscf/day
              </span>
            </div>

            <div className="kpi-cell">
              <span className="kpi-label">Initial Z Factor</span>
              <div className="kpi-number">{results.zi}</div>
              <span className="kpi-context">{getZMethodLabel(results.activeZMethod)}</span>
            </div>
          </div>
        </div>

        {/* Top Right Card: Correlation Comparison Matrix Across Pressure Stages */}
        <div className="grid-card z-matrix-card">
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
            <span className="matrix-legend-item">
              Pseudocritical: {results.activePseudoMethod === 'none' ? 'None' : results.activePseudoMethod}
            </span>
            <span className="matrix-legend-item">Effective Gravity: {results.effectiveGasGravity}</span>
          </div>
        </div>

        {!isGuest && (
          <>
            {/* Switched PRMS Reserve Classification Card */}
            <div className="grid-card reserve-classification-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">PRMS Reserve Classification</h3>
                  <div className="card-subtitle">{activeReserveView.subtitle}</div>
                </div>

                <div className="reserve-switch-group" role="tablist" aria-label="PRMS Reserve Classification">
                  {RESERVE_CLASS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeReserveClass === tab.id}
                      onClick={() => setActiveReserveClass(tab.id)}
                      className={
                        activeReserveClass === tab.id ? 'reserve-switch-btn active' : 'reserve-switch-btn'
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeReserveClass}
                  className="reserve-classification-kpis"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeReserveView.metrics.map((metric) => (
                    <div key={metric.label} className="kpi-cell">
                      <span className="kpi-label">{metric.label}</span>
                      <div className="kpi-number">{metric.value}</div>
                      <span className="kpi-context">{metric.context}</span>
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* All Methods and Volumetric vs Hydraulic MBE Comparison Card */}
            <div className="grid-card reserve-classification-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title">Reserves Estimation Method Comparison</h3>
                  <div className="card-subtitle">
                    Side-by-side Volumetric, Volumetric Gas MBE (We = 0), Hydraulic Water-Drive MBE (We &gt; 0), and Arps Decline results
                  </div>
                </div>
              </div>

              <div className="reserve-classification-kpis">
                <div className="kpi-cell">
                  <span className="kpi-label">Volumetric Method EUR</span>
                  <div className="kpi-number">{results.volRes.ultimateRecoveryBscf.toFixed(2)} Bscf</div>
                  <span className="kpi-context">
                    GIIP {results.volRes.giipBscf.toFixed(2)} Bscf (Rf {(results.volRes.activeRf * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="kpi-cell">
                  <span className="kpi-label">Volumetric Gas MBE (We = 0)</span>
                  <div className="kpi-number">{results.mbeRes.volumetricMbeEurBscf.toFixed(2)} Bscf</div>
                  <span className="kpi-context">
                    GIIP {results.mbeRes.volumetricMbeGiipBscf.toFixed(2)} Bscf (No water influx)
                  </span>
                </div>

                <div className="kpi-cell">
                  <span className="kpi-label">Hydraulic Water-Drive MBE (We &gt; 0)</span>
                  <div className="kpi-number">{results.mbeRes.hydraulicMbeEurBscf.toFixed(2)} Bscf</div>
                  <span className="kpi-context">
                    Apparent GIIP {results.mbeRes.hydraulicApparentGiipBscf.toFixed(2)} Bscf (We {(results.mbeRes.aquiferPotentialWeBbl / 1e6).toFixed(2)} MMbbl)
                  </span>
                </div>

                <div className="kpi-cell">
                  <span className="kpi-label">Arps Decline Curve EUR</span>
                  <div className="kpi-number">{results.dcaRes.activeEurBscf.toFixed(2)} Bscf</div>
                  <span className="kpi-context">
                    {results.activeDeclineModel} (b = {results.dcaRes.bExponent}, qa {results.dcaRes.estimatedEconomicLimitMscfDay.toLocaleString()} Mscf/d)
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom Left Card: Main Chart with Tab Switcher */}
        <div className="grid-card large-chart-card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Reservoir Depletion Curves</h3>
              <div className="card-subtitle">Material balance, decline curve, and production forecast</div>
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
                onClick={() => setActiveChartTab('forecast')}
                className={activeChartTab === 'forecast' ? 'tab-pill active' : 'tab-pill'}
              >
                Forecast
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
                <LineChart data={results.mbeRes.pzComparisonCurve} margin={{ top: 10, right: 16, left: -6, bottom: 10 }}>
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
                <LineChart data={results.zCurve} margin={{ top: 10, right: 16, left: -6, bottom: 10 }}>
                  <XAxis dataKey="pressure" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis domain={['auto', 'auto']} stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="hallYarborough" name="Hall-Yarborough" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="brillBeggs" name="Brill-Beggs" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dak" name="Dranchuk-Abou-Kassem" stroke="#34d399" strokeWidth={2} dot={false} />
                  {results.zCurve.some((pt) => pt.providedZ !== undefined) && (
                    <Line type="monotone" dataKey="providedZ" name="Provided Z Factor" stroke="#d97706" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2, fill: '#d97706' }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'cole' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.mbeRes.havlenaOdehPoints} margin={{ top: 10, right: 16, left: -6, bottom: 10 }}>
                  <XAxis dataKey="gpBscf" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} />
                  <Line type="monotone" dataKey="coleApparentGBscf" name="Apparent GIIP F/Eg (Bscf)" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669' }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'dca' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.dcaRes.dcaCurve} margin={{ top: 10, right: 16, left: 4, bottom: 10 }}>
                  <XAxis
                    dataKey="year"
                    stroke={chartThemeStyles.axisStroke}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }}
                    tickFormatter={(v) => `${v}y`}
                  />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} labelFormatter={(v) => `Year ${v}`} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="hyperbolicRate" name="Hyperbolic (Mscf/d)" stroke="#059669" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="exponentialRate" name="Exponential (Mscf/d)" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="harmonicRate" name="Harmonic (Mscf/d)" stroke="#9ca3af" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="economicLimit" name="Economic Limit (Mscf/d)" stroke="#d97706" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'forecast' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={activeForecast.forecastCurve} margin={{ top: 10, right: 16, left: -6, bottom: 10 }}>
                  <XAxis
                    dataKey="year"
                    stroke={chartThemeStyles.axisStroke}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }}
                    tickFormatter={(v) => `${v}y`}
                  />
                  <YAxis yAxisId="left" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis yAxisId="right" orientation="right" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} labelFormatter={(v) => `Year ${v}`} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="cumulativeBscf" name="Gas Production Cumulative (Bscf)" stroke="#059669" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="rateMmscfDay" name="Gas Production Rate (MMscf/d)" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pressurePsia" name="Reservoir Pressure (psia)" stroke="#c026d3" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'prms' && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.prmsRes.probabilityCurve} margin={{ top: 10, right: 16, left: -6, bottom: 10 }}>
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
              <div className="card-subtitle">Material balance volume contribution ({aquiferDisplayName})</div>
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

      {/* Dedicated Always-Visible Decline Curve and Production Forecast Section */}
      <motion.div
        key={`forecast-section-${activeProject.id}`}
        className="grid-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Decline Curve and Gas Production Forecast</h3>
            <div className="card-subtitle">
              Production rate, cumulative gas, and reservoir pressure trajectory to deplete {activeForecast.eurBscf.toFixed(2)} Bscf for {activeProject.name}
            </div>
          </div>

          {isGuest ? (
            <div className="guest-forecast-note">
              Recommended scenario shown in Guest Preview
            </div>
          ) : (
            <div className="reserve-switch-group" role="tablist" aria-label="Forecast Reserves Basis">
              {FORECAST_SCENARIO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeForecastScenario === tab.id}
                  onClick={() => setActiveForecastScenario(tab.id)}
                  className={
                    activeForecastScenario === tab.id ? 'reserve-switch-btn active' : 'reserve-switch-btn'
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="forecast-kpi-row">
          <div className="kpi-cell">
            <span className="kpi-label">Years to Deplete (X)</span>
            <div className="kpi-number">{activeForecast.yearsToDeplete.toFixed(1)} years</div>
            <span className="kpi-context">
              {activeForecast.monthsToDeplete.toFixed(0)} months ({activeForecast.targetDepletionApplied ? 'Target X applied' : 'Calculated at assumed qi'})
            </span>
          </div>

          <div className="kpi-cell">
            <span className="kpi-label">Assumed Production Rate (qi)</span>
            <div className="kpi-number">{activeForecast.qiMscfDay.toLocaleString()} Mscf/day</div>
            <span className="kpi-context">
              {activeForecast.targetDepletionApplied
                ? `Required rate to deplete ${activeForecast.eurBscf.toFixed(2)} Bscf in ${activeForecast.yearsToDeplete.toFixed(1)} yrs`
                : `Avg rate ${activeForecast.averageRateMscfDay.toLocaleString()} Mscf/day (EUR ${activeForecast.eurBscf.toFixed(2)} Bscf)`}
            </span>
          </div>

          <div className="kpi-cell">
            <span className="kpi-label">Calculated Economic Limit (qa)</span>
            <div className="kpi-number">{activeForecast.qaMscfDay.toLocaleString()} Mscf/day</div>
            <span className="kpi-context">
              Output cutoff ({results.activeDeclineModel}, b = {activeForecast.bExponent})
            </span>
          </div>

          <div className="kpi-cell">
            <span className="kpi-label">Cumulative Water Influx (We)</span>
            <div className="kpi-number">{(results.mbeRes.activeWeBbl / 1e6).toFixed(2)} MMbbl</div>
            <span className="kpi-context">
              Aquifer potential {(results.mbeRes.aquiferPotentialWeBbl / 1e6).toFixed(2)} MMbbl ({aquiferDisplayName})
            </span>
          </div>
        </div>

        {activeForecast.canProduce ? (
          <div className="forecast-charts-grid">
            <div className="forecast-chart-box">
              <div className="forecast-chart-title">Arps Decline Curve (Rate vs Years)</div>
              <div className="forecast-chart-subtitle">
                Flow rate trajectory across hyperbolic, exponential, and harmonic decline to economic limit
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={results.dcaRes.dcaCurve} margin={{ top: 10, right: 16, left: 4, bottom: 10 }}>
                  <XAxis
                    dataKey="year"
                    stroke={chartThemeStyles.axisStroke}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }}
                    tickFormatter={(v) => `${v}y`}
                  />
                  <YAxis stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} labelFormatter={(v) => `Year ${v}`} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="hyperbolicRate" name="Hyperbolic (Mscf/d)" stroke="#059669" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="exponentialRate" name="Exponential (Mscf/d)" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="harmonicRate" name="Harmonic (Mscf/d)" stroke="#9ca3af" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="economicLimit" name="Economic Limit qa" stroke="#d97706" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="forecast-chart-box">
              <div className="forecast-chart-title">Gas Production, Rate, and Pressure Forecast</div>
              <div className="forecast-chart-subtitle">
                Cumulative gas produced (Bscf), gas production rate (MMscf/d), and reservoir pressure (psia) over {activeForecast.yearsToDeplete.toFixed(1)} years
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={activeForecast.forecastCurve} margin={{ top: 10, right: 16, left: -4, bottom: 10 }}>
                  <XAxis
                    dataKey="year"
                    stroke={chartThemeStyles.axisStroke}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }}
                    tickFormatter={(v) => `${v}y`}
                  />
                  <YAxis yAxisId="left" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <YAxis yAxisId="right" orientation="right" stroke={chartThemeStyles.axisStroke} tickLine={false} tick={{ fontSize: 11, fill: chartThemeStyles.tickFill }} />
                  <Tooltip contentStyle={chartThemeStyles.tooltip} labelFormatter={(v) => `Year ${v}`} />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="left" type="monotone" dataKey="cumulativeBscf" name="Cumulative Gas (Bscf)" stroke="#059669" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="rateMmscfDay" name="Gas Rate (MMscf/d)" stroke={chartThemeStyles.contrastLine} strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pressurePsia" name="Pressure (psia)" stroke="#c026d3" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem' }}>
            Enter positive recoverable volume and production rate parameters to generate the production forecast.
          </p>
        )}
      </motion.div>

      {isGuest ? (
        <StudentAccessGate
          compact
          title="Unlock Full Analysis, PRMS Scenarios, and Depletion Schedule"
          description="Guest preview displays headline reserves, drive mechanism shares, and the recommended decline curve. Sign in with a student email to inspect the complete analysis on this page."
          highlights={[
            'PRMS 1P (P90), 2P (P50), and 3P (P10) reserves and uncertainty spread',
            'Side-by-side Volumetric, Material Balance (We = 0 and We > 0), and Arps comparison',
            'Fluid classification, Z-factor audit values, and year-by-year depletion table',
          ]}
        />
      ) : (
        /* Detailed Evaluation Accordions */
        <motion.div
          key={`detailed-eval-${activeProject.id}`}
          className="evaluation-view-container"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="form-block-heading" style={{ marginTop: 0 }}>
              Detailed Engineering Results
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
              Expand each section below to inspect fluid classification, PRMS distributions, material balance indices, and the annual production forecast schedule.
            </p>
          </div>

          <div className="collapsible-list">
          {sectionMatches('fluid classification condensate gor api gravity yield') && (
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
                  <span className="data-value">{(results.wetProps.initialCondensateInPlaceStb / 1e6).toFixed(2)} MMSTB</span>
                </div>
              </div>
              <p className="diagnostic-note">{results.classification.phaseRegime}</p>
            </CollapsibleSection>
          )}

          {sectionMatches('prms reserves classification 1p 2p 3p proved probable possible recommendation') && (
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
                  <span className="data-label">Incremental Probable Reserves</span>
                  <span className="data-value">+{results.prmsRes.probableIncrementalBscf.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">2P Proved plus Probable (P50)</span>
                  <span className="data-value highlight">{results.prmsRes.reserve2P.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Incremental Possible Reserves</span>
                  <span className="data-value">+{results.prmsRes.possibleIncrementalBscf.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">3P Proved, Probable and Possible (P10)</span>
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
              <p className="diagnostic-note">{results.recommendation.evidence}</p>
            </CollapsibleSection>
          )}

          {sectionMatches('z factor gas deviation pseudo reduced bgi real gas') && (
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
                  <span className="data-value">
                    {results.activePseudoMethod === 'none'
                      ? 'None (Not Applied)'
                      : results.initialReduced.ppr.toFixed(3)}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Pseudo-Reduced Temp Tpr</span>
                  <span className="data-value">
                    {results.activePseudoMethod === 'none'
                      ? 'None (Not Applied)'
                      : results.initialReduced.tpr.toFixed(3)}
                  </span>
                </div>
                <div className="data-item">
                  <span className="data-label">Initial Bgi (ft3/scf)</span>
                  <span className="data-value">{results.bgiCuft} ft3/scf</span>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {sectionMatches('volumetric material balance aquifer pot schilthuis water influx') && (
            <CollapsibleSection
              index={3}
              title="Volumetric, Aquifer, and Material Balance Indices"
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
                <div className="data-item">
                  <span className="data-label">Volumetric Gas MBE EUR (We = 0)</span>
                  <span className="data-value">{results.mbeRes.volumetricMbeEurBscf.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Hydraulic Water-Drive MBE EUR (We &gt; 0)</span>
                  <span className="data-value">{results.mbeRes.hydraulicMbeEurBscf.toFixed(2)} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Aquifer Influx Model</span>
                  <span className="data-value">{aquiferDisplayName}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Cumulative Water Influx (Active We)</span>
                  <span className="data-value">{(results.mbeRes.activeWeBbl / 1e6).toFixed(2)} MMbbl</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Aquifer Influx Potential (We)</span>
                  <span className="data-value">{(results.mbeRes.aquiferPotentialWeBbl / 1e6).toFixed(2)} MMbbl</span>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {sectionMatches('production forecast years deplete decline schedule cumulative') && (
            <CollapsibleSection
              index={4}
              title={`Annual Production Forecast Schedule (${activeForecast.yearsToDeplete.toFixed(1)} Years to Deplete)`}
              isOpen={activeSection === 4}
              onToggle={toggleSection}
              delay={0.17}
            >
              <div className="forecast-schedule-wrapper">
                <table className="forecast-schedule-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Rate (Mscf/d)</th>
                      <th>Pressure (psia)</th>
                      <th>Period Volume (Bscf)</th>
                      <th>Cumulative (Bscf)</th>
                      <th>Remaining (Bscf)</th>
                      <th>Depleted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeForecast.yearlySchedule.map((row) => (
                      <tr key={row.yearLabel}>
                        <td>{row.yearLabel}</td>
                        <td>{row.rateMscfDay.toLocaleString()}</td>
                        <td>{row.pressurePsia}</td>
                        <td>{row.periodProductionBscf.toFixed(2)}</td>
                        <td>{row.cumulativeProductionBscf.toFixed(2)}</td>
                        <td>{row.remainingReservesBscf.toFixed(2)}</td>
                        <td>{row.recoveryPct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
