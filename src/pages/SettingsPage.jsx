import { motion } from 'framer-motion'
import { useReservoir } from '../context/useReservoir'
import { useAuth } from '../context/useAuth'

export function SettingsPage() {
  const { activeProject, storageStatus } = useReservoir()
  const { user, studentProfile, isGuest, signOut } = useAuth()

  const syncModeLabel = isGuest
    ? 'Guest Preview Session (In-Memory Only, Not Saved)'
    : storageStatus.mode === 'supabase'
      ? storageStatus.error
        ? `Supabase Cloud Sync Error (${storageStatus.error})`
        : 'Supabase Cloud Sync Active'
      : 'Session Memory Mode'

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
          Engineering Methodology Settings
        </h2>
        <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
          Active workspace, account access level, solver tolerances, and unit conventions used across all calculations.
        </p>
      </div>

      <div className="report-table-box">
        <div className="report-table-row">
          <span className="report-row-label">Access Level</span>
          <span className="report-row-value">
            {isGuest ? 'Guest Preview (Limited Access)' : 'Full Account'}
          </span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">{isGuest ? 'Session Mode' : 'Signed-In Email'}</span>
          <span className="report-row-value">{user?.email || 'Active Session'}</span>
        </div>
        {!isGuest && user?.fullName && (
          <div className="report-table-row">
            <span className="report-row-label">Full Name</span>
            <span className="report-row-value">{user.fullName}</span>
          </div>
        )}
        {!isGuest && user?.institution && (
          <div className="report-table-row">
            <span className="report-row-label">Organization / Domain</span>
            <span className="report-row-value">{user.institution}</span>
          </div>
        )}
        {!isGuest && studentProfile && (
          <div className="report-table-row">
            <span className="report-row-label">Saved Login Record</span>
            <span className="report-row-value">
              {studentProfile.loginCount} {studentProfile.loginCount === 1 ? 'sign-in' : 'sign-ins'} recorded
              {studentProfile.lastLoginAt
                ? ` (${new Date(studentProfile.lastLoginAt).toLocaleString()})`
                : ''}
            </span>
          </div>
        )}
        <div className="report-table-row">
          <span className="report-row-label">Active Project Workspace</span>
          <span className="report-row-value">{activeProject.name}</span>
        </div>
        <div className="report-table-row">
          <span className="report-row-label">Workspace Persistence</span>
          <span className="report-row-value">{syncModeLabel}</span>
        </div>
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
          <span className="report-row-value">1.0e-7 convergence (1.0e-12 derivative guard)</span>
        </div>
      </div>

      <div className="settings-actions-row">
        <button type="button" className="secondary-action-btn" onClick={signOut}>
          {isGuest ? 'Sign In or Create Free Account' : 'Sign Out'}
        </button>
      </div>
    </motion.div>
  )
}
