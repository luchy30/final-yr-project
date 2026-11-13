import { motion } from 'framer-motion'

export function ProjectsPage() {
  return (
    <motion.div
      key="projects-page"
      className="form-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="form-block-heading" style={{ marginTop: 0 }}>
          Reservoir Evaluation Projects
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Select a project scenario or start a new reservoir appraisal study.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
            Niger Delta Gas Sand A
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Active depletion study with Fetkovich radial aquifer support and Hall-Yarborough Z-factor modeling.
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            Active Project
          </div>
        </div>

        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
            Deep Offshore Condensate B
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Class III gas condensate reservoir with two-phase Z-factor tracking and condensate yield estimation.
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Appraisal Phase
          </div>
        </div>

        <div className="standard-card">
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
            Mature Field Decline C
          </h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Late life Arps hyperbolic production decline forecast and economic abandonment analysis.
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Production History
          </div>
        </div>
      </div>
    </motion.div>
  )
}

