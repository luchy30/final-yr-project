import { motion } from 'framer-motion'

export function SettingsPage() {
  return (
    <motion.div
      key="settings-page"
      className="form-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="form-block-heading" style={{ marginTop: 0 }}>
          System Settings and Preferences
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Configured engineering units, baseline reference conditions, and simulation options.
        </p>
      </div>

      <div className="report-table-box">
        <div className="report-table-row">
          <span className="report-row-label">Measurement Units</span>
          <span className="report-row-value">Oilfield Standard (psia, deg F, acres, scf)</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Standard Conditions</span>
          <span className="report-row-value">14.7 psia and 60 deg F</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Monte Carlo Iterations</span>
          <span className="report-row-value">2,500 trials (seeded deterministic)</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Non-Linear Solver Tolerance</span>
          <span className="report-row-value">1.0e-12 (Newton-Raphson Z-Factor)</span>
        </div>
      </div>
    </motion.div>
  )
}

