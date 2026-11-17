import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun01Icon, Moon01Icon } from 'hugeicons-react'
import { useAuth } from '../context/useAuth'

export function LoginPage() {
  const { theme, handleThemeChange, rememberedLogin, signIn, signUp, enterGuestMode } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('signin')
  const [fullName, setFullName] = useState('')
  const [institution, setInstitution] = useState('')
  const [email, setEmail] = useState(() => rememberedLogin?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => rememberedLogin?.rememberMe !== false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [noticeMessage, setNoticeMessage] = useState('')

  const handleModeSwitch = (nextMode) => {
    setMode(nextMode)
    setErrorMessage('')
    setNoticeMessage('')
  }

  const handleGuestAccess = () => {
    enterGuestMode()
    navigate('/calculations', { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setNoticeMessage('')
    setSubmitting(true)

    try {
      if (mode === 'signin') {
        const res = await signIn({ email, password, rememberMe })
        if (!res.ok) {
          setErrorMessage(res.error || 'Could not sign in.')
          return
        }
        navigate('/calculations', { replace: true })
        return
      }

      const res = await signUp({
        email,
        password,
        confirmPassword,
        fullName,
        institution,
        rememberMe,
      })

      if (!res.ok) {
        setErrorMessage(res.error || 'Could not create student account.')
        return
      }

      if (res.requiresConfirmation) {
        setNoticeMessage(
          res.message || 'Check your student inbox to confirm your email, then sign in.'
        )
        setMode('signin')
        setPassword('')
        setConfirmPassword('')
        return
      }

      navigate('/calculations', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`auth-page theme-${theme}`} data-theme={theme}>
      <div className="auth-topbar">
        <div className="auth-brand-row">
          <img
            src={theme === 'dark' ? '/logo-white.svg' : '/logo-black.svg'}
            alt="PetroReserves logo"
            className="auth-brand-logo"
            width={28}
            height={28}
          />
          <span className="auth-brand-name">PetroReserves</span>
        </div>

        <div className="reserve-switch-group" aria-label="Appearance theme">
          <button
            type="button"
            className={`reserve-switch-btn auth-theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <Sun01Icon size={15} />
            <span>Light</span>
          </button>
          <button
            type="button"
            className={`reserve-switch-btn auth-theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <Moon01Icon size={15} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      <main className="auth-center-stage">
        <section className="auth-card" aria-labelledby="auth-heading">
          <div className="auth-header">
            <h1 id="auth-heading" className="auth-title">
              Gas Reserves Estimation Platform
            </h1>
            <p className="auth-subtitle">
              Free gas reservoir engineering workspace with P/Z material balance, Monte Carlo
              reserves, and production forecasting. Sign in with any email address to save
              your reservoir studies across sessions.
            </p>
          </div>

          <div className="reserve-switch-group auth-mode-switch" role="tablist" aria-label="Account mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`reserve-switch-btn auth-mode-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`reserve-switch-btn auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('signup')}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {mode === 'signup' && (
              <div className="auth-optional-grid">
                <div className="input-cell">
                  <label htmlFor="auth-full-name">Full Name (Optional)</label>
                  <input
                    id="auth-full-name"
                    name="fullName"
                    type="text"
                    className="standard-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Oluchi Okafor"
                    autoComplete="name"
                  />
                </div>

                <div className="input-cell">
                  <label htmlFor="auth-institution">Organization or University (Optional)</label>
                  <input
                    id="auth-institution"
                    name="institution"
                    type="text"
                    className="standard-input"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Federal University of Technology"
                    autoComplete="organization"
                  />
                </div>
              </div>
            )}

            <div className="input-cell">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                className="standard-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="username"
                required
              />
              <span className="auth-field-hint">
                Open to everyone: use any personal, work, or university email address.
              </span>
            </div>

            <div className="input-cell">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-password-row">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="standard-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="input-cell">
                <label htmlFor="auth-confirm-password">Confirm Password</label>
                <input
                  id="auth-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="standard-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <label className="auth-remember-row">
              <input
                type="checkbox"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-remember-checkbox"
              />
              <span className="auth-remember-copy">
                <span className="auth-remember-title">Save login info on this device</span>
                <span className="auth-remember-hint">
                  Stays signed in and remembers your email with encrypted browser storage.
                </span>
              </span>
            </label>

            {errorMessage && (
              <div className="auth-feedback-error" role="alert">
                {errorMessage}
              </div>
            )}

            {noticeMessage && (
              <div className="auth-feedback-notice" role="status">
                {noticeMessage}
              </div>
            )}

            <button
              type="submit"
              className="primary-submit-btn auth-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? mode === 'signin'
                  ? 'Signing In...'
                  : 'Creating Account...'
                : mode === 'signin'
                  ? 'Sign In to Workspace'
                  : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer-switch">
            {mode === 'signin' ? (
              <button
                type="button"
                className="auth-text-link"
                onClick={() => handleModeSwitch('signup')}
              >
                New here? Create a free account
              </button>
            ) : (
              <button
                type="button"
                className="auth-text-link"
                onClick={() => handleModeSwitch('signin')}
              >
                Already have an account? Sign in
              </button>
            )}
          </div>

          <div className="auth-guest-block">
            <button
              type="button"
              className="secondary-action-btn auth-guest-btn"
              onClick={handleGuestAccess}
            >
              Continue as Guest Preview
            </button>
            <p className="auth-guest-note">
              Explore sample reserve calculations without an account. Multi-project cloud workspaces,
              PRMS 1P/2P/3P breakdown, and downloadable reports require signing in.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
