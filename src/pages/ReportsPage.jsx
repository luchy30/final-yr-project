import { motion } from 'framer-motion'
import { useReservoir } from '../context/useReservoir'
import { useAuth } from '../context/useAuth'
import { StudentAccessGate } from '../components/StudentAccessGate'

export function ReportsPage() {
  const { activeProject, results, getZMethodLabel } = useReservoir()
  const { isGuest } = useAuth()

  if (isGuest) {
    return (
      <motion.div
        key="reports-guest-gate"
        className="form-view-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <StudentAccessGate
          title="Executive Gas Reserves Report and Export"
          description="Detailed audit summaries, CSV spreadsheet downloads, and print-ready executive reports unlock when you sign in."
          highlights={[
            'Export volumetric, material balance, PRMS, and yearly schedule tables to CSV',
            'Print formatted executive audit sheets for academic coursework and defense review',
            'Access full Z-factor and water influx audit rows',
          ]}
        />
      </motion.div>
    )
  }

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
      ['Gas-Oil Ratio GOR (scf/STB)', Math.round(results.gorScfStb)],
      ['Condensate-Gas Ratio CGR (STB/MMscf)', results.cgrStbMmscf.toFixed(2)],
      ['Z-Factor Correlation', getZMethodLabel(results.activeZMethod)],
      ['Initial Z-Factor', results.zi],
      ['Aquifer Model', aquiferName],
      ['Original Gas in Place (Bscf)', results.volRes.giipBscf.toFixed(2)],
      ['Forecast Gas in Place (Bscf)', results.forecastRes.giipBscf.toFixed(2)],
      ['Volumetric Gas MBE EUR We = 0 (Bscf)', results.mbeRes.volumetricMbeEurBscf.toFixed(2)],
      ['Hydraulic Water-Drive MBE EUR We > 0 (Bscf)', results.mbeRes.hydraulicMbeEurBscf.toFixed(2)],
      ['Cumulative Water Influx Active We (MMbbl)', (results.mbeRes.activeWeBbl / 1e6).toFixed(2)],
      ['Aquifer Model Influx Potential We (MMbbl)', (results.mbeRes.aquiferPotentialWeBbl / 1e6).toFixed(2)],
      ['Estimated Ultimate Recovery (Bscf)', results.recommendation.finalRecommendedEurBscf.toFixed(2)],
      ['Assumed Production Rate qi (Mscf/day)', results.forecastRes.qiMscfDay],
      ['Calculated Economic Limit qa (Mscf/day)', results.forecastRes.qaMscfDay],
      [
        'Producing / Production Time (Years)',
        results.productionTimeYears > 0 ? results.productionTimeYears : 'Default (1080 days)',
      ],
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
        'Pressure (psia)',
        'Period Production (Bscf)',
        'Cumulative Produced (Bscf)',
        'Remaining Reserves (Bscf)',
        'Recovery (%)',
      ],
      ...results.forecastRes.yearlySchedule.map((row) => [
        row.year,
        row.rateMscfDay,
        row.pressurePsia,
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
          <span className="report-row-label">Gas-Oil Ratio GOR / CGR</span>
          <span className="report-row-value">
            {Math.round(results.gorScfStb).toLocaleString()} scf/STB ({results.cgrStbMmscf.toFixed(2)} STB/MMscf)
          </span>
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
          <span className="report-row-label">Cumulative Water Influx (Active / Potential We)</span>
          <span className="report-row-value">
            {(results.mbeRes.activeWeBbl / 1e6).toFixed(2)} MMbbl active ({(results.mbeRes.aquiferPotentialWeBbl / 1e6).toFixed(2)} MMbbl potential)
          </span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Original Gas in Place (G)</span>
          <span className="report-row-value">{results.volRes.giipBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Forecast Gas in Place (GIIP)</span>
          <span className="report-row-value">{results.forecastRes.giipBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Volumetric Gas MBE EUR (We = 0)</span>
          <span className="report-row-value">{results.mbeRes.volumetricMbeEurBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Hydraulic Water-Drive MBE EUR (We &gt; 0)</span>
          <span className="report-row-value">{results.mbeRes.hydraulicMbeEurBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Estimated Ultimate Recovery (EUR)</span>
          <span className="report-row-value accent">
            {results.recommendation.finalRecommendedEurBscf.toFixed(2)} Bscf
          </span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Assumed Production Rate (qi)</span>
          <span className="report-row-value">{results.forecastRes.qiMscfDay.toLocaleString()} Mscf/day</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Calculated Economic Limit (qa Output)</span>
          <span className="report-row-value accent">{results.forecastRes.qaMscfDay.toLocaleString()} Mscf/day</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Producing / Production Time (t)</span>
          <span className="report-row-value">
            {results.productionTimeYears > 0
              ? `${results.productionTimeYears} years (${Math.round(results.productionTimeDays).toLocaleString()} days)`
              : 'Default (3.0 years / 1,080 days)'}
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
