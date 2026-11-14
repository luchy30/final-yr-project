import { motion } from 'framer-motion'
import { useReservoir } from '../context/useReservoir'

export function ReportsPage() {
  const { activeProject, results, getZMethodLabel } = useReservoir()

  const aquiferName =
    results.activeAquiferModel === 'schilthuis'
      ? 'Schilthuis Steady-State Model'
      : 'Pot Aquifer Model'

  const handleExportCsv = () => {
    const lines = [
      ['Project Workspace', activeProject.name],
      ['Description', activeProject.description],
      ['Project Classification', results.recommendation.reservoirClass],
      ['Identified Fluid Type', results.classification.fluidType],
      ['Z-Factor Correlation', getZMethodLabel(results.activeZMethod)],
      ['Initial Z-Factor', results.zi],
      ['Aquifer Model', aquiferName],
      ['Original Gas in Place (Bscf)', results.volRes.giipBscf.toFixed(2)],
      ['Estimated Ultimate Recovery (Bscf)', results.recommendation.finalRecommendedEurBscf.toFixed(2)],
      ['Estimated Depletion Time (Years)', results.forecastRes.yearsToDeplete.toFixed(2)],
      ['PRMS 1P Proved Reserves (Bscf)', results.prmsRes.reserve1P.toFixed(2)],
      ['PRMS Incremental Probable Reserves (Bscf)', results.prmsRes.probableIncrementalBscf.toFixed(2)],
      ['PRMS 2P Proved plus Probable Reserves (Bscf)', results.prmsRes.reserve2P.toFixed(2)],
      ['PRMS Incremental Possible Reserves (Bscf)', results.prmsRes.possibleIncrementalBscf.toFixed(2)],
      ['PRMS 3P Proved, Probable and Possible Reserves (Bscf)', results.prmsRes.reserve3P.toFixed(2)],
      ['Primary Drive Mechanism', results.recommendation.dominantDrive],
      [],
      [
        'Year',
        'Rate (Mscf/day)',
        'Period Production (Bscf)',
        'Cumulative Produced (Bscf)',
        'Remaining Reserves (Bscf)',
        'Recovery (%)',
      ],
      ...results.forecastRes.yearlySchedule.map((row) => [
        row.year,
        row.rateMscfDay,
        row.periodProductionBscf,
        row.cumulativeProductionBscf,
        row.remainingReservesBscf,
        row.recoveryPct,
      ]),
    ]

    const csvText = lines
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const slug = activeProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    link.href = url
    link.download = `${slug}-reserves-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      key={`reports-page-${activeProject.id}`}
      className="form-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="projects-header-row" style={{ marginBottom: '2rem' }}>
        <div>
          <h2 className="form-block-heading" style={{ marginTop: 0 }}>
            Executive Gas Reserves Report
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Audit summary for {activeProject.name} across volumetric, material balance, forecast depletion, and PRMS reserves.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleExportCsv} className="secondary-action-btn">
            Export CSV
          </button>
          <button type="button" onClick={() => window.print()} className="top-action-btn">
            Print Report
          </button>
        </div>
      </div>

      <div className="report-table-box">
        <div className="report-table-row">
          <span className="report-row-label">Active Field Workspace</span>
          <span className="report-row-value">{activeProject.name}</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Project Classification</span>
          <span className="report-row-value">{results.recommendation.reservoirClass}</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Identified Fluid Type</span>
          <span className="report-row-value">{results.classification.fluidType}</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Z-Factor Correlation and Initial Z</span>
          <span className="report-row-value">
            {getZMethodLabel(results.activeZMethod)} ({results.zi})
          </span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Aquifer Influx Model</span>
          <span className="report-row-value">{aquiferName}</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Original Gas in Place (G)</span>
          <span className="report-row-value">{results.volRes.giipBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Estimated Ultimate Recovery (EUR)</span>
          <span className="report-row-value accent">
            {results.recommendation.finalRecommendedEurBscf.toFixed(2)} Bscf
          </span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Estimated Depletion Time (Reserve-Matched)</span>
          <span className="report-row-value accent">
            {results.forecastRes.yearsToDeplete.toFixed(1)} years ({results.forecastRes.monthsToDeplete.toFixed(0)} months)
          </span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS 1P Proved Reserves (P90)</span>
          <span className="report-row-value">{results.prmsRes.reserve1P.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS Incremental Probable Reserves</span>
          <span className="report-row-value">+{results.prmsRes.probableIncrementalBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS 2P Proved plus Probable (P50)</span>
          <span className="report-row-value">{results.prmsRes.reserve2P.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS Incremental Possible Reserves</span>
          <span className="report-row-value">+{results.prmsRes.possibleIncrementalBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS 3P Proved, Probable and Possible (P10)</span>
          <span className="report-row-value">{results.prmsRes.reserve3P.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Primary Drive Mechanism</span>
          <span className="report-row-value">{results.recommendation.dominantDrive}</span>
        </div>
      </div>
    </motion.div>
  )
}
