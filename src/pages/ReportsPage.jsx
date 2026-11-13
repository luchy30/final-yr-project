import { motion } from 'framer-motion'
import { useReservoir } from '../context/ReservoirContext'

export function ReportsPage() {
  const { results } = useReservoir()

  return (
    <motion.div
      key="reports-page"
      className="form-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="form-block-heading" style={{ marginTop: 0 }}>
          Executive Gas Reserves Report
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Standard petroleum engineering audit report summarizing volumetric, material balance, and PRMS reserves.
        </p>
      </div>

      <div className="report-table-box">
        <div className="report-table-row">
          <span className="report-row-label">Project Classification</span>
          <span className="report-row-value">{results.recommendation.reservoirClass}</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Original Gas in Place (G)</span>
          <span className="report-row-value">{results.volRes.giipBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Estimated Ultimate Recovery (EUR)</span>
          <span className="report-row-value accent">{results.recommendation.finalRecommendedEurBscf.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS 1P Proved Reserves</span>
          <span className="report-row-value">{results.prmsRes.reserve1P.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS 2P Probable Reserves</span>
          <span className="report-row-value">{results.prmsRes.reserve2P.toFixed(2)} Bscf</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">PRMS 3P Possible Reserves</span>
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
