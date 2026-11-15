import { useNavigate } from 'react-router-dom'
import { LockIcon } from 'hugeicons-react'
import { useAuth } from '../context/useAuth'

export function StudentAccessGate({
  title = 'Full Student Account Required',
  description = 'Guest preview provides sample reservoir inputs and top-level metrics. Sign in with your university or institutional student email to unlock the full workspace for free.',
  highlights = [],
  compact = false,
}) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleOpenLogin = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <section className={compact ? 'student-gate-card compact' : 'student-gate-card'}>
      <div className="student-gate-header">
        <div className="student-gate-icon">
          <LockIcon size={20} />
        </div>
        <h3 className="student-gate-title">{title}</h3>
      </div>

      <p className="student-gate-description">{description}</p>

      {highlights.length > 0 && (
        <div className="student-gate-highlights">
          {highlights.map((item) => (
            <div key={item} className="student-gate-highlight-item">
              {item}
            </div>
          ))}
        </div>
      )}

      <div className="student-gate-actions">
        <button type="button" className="primary-submit-btn student-gate-btn" onClick={handleOpenLogin}>
          Sign In or Create Free Student Account
        </button>
      </div>
    </section>
  )
}
