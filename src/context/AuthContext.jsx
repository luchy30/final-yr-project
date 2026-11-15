import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './useAuth'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import {
  validateStudentEmail,
  formatStudentUser,
  getEmailDomain,
  loadLocalStudentSession,
  clearLocalStudentSession,
  registerLocalStudentAccount,
  signInLocalStudentAccount,
} from '../lib/studentAuth'

function mapAuthErrorMessage(rawMessage) {
  const message = String(rawMessage || '')
  if (/invalid login credentials/i.test(message)) {
    return 'Incorrect student email or password.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirm your student email before signing in.'
  }
  if (/user already registered/i.test(message)) {
    return 'A student account with this email already exists. Sign in instead.'
  }
  return message || 'Authentication failed. Check your student details and try again.'
}

export function AuthProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    return saved || 'light'
  })

  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
  }, [])

  const [user, setUser] = useState(() => {
    if (isSupabaseConfigured) return null
    return formatStudentUser(loadLocalStudentSession())
  })
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return undefined
    }

    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setUser(formatStudentUser(data?.session?.user || null))
        setLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setUser(null)
        setLoading(false)
      })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(formatStudentUser(session?.user || null))
      setLoading(false)
    })

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const validation = validateStudentEmail(email)
    if (!validation.valid) {
      return { ok: false, error: validation.error }
    }

    if (!password) {
      return { ok: false, error: 'Enter your password.' }
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validation.normalizedEmail,
        password,
      })

      if (error) {
        return { ok: false, error: mapAuthErrorMessage(error.message) }
      }

      const mappedUser = formatStudentUser(data?.user || null)
      setUser(mappedUser)
      return { ok: true, user: mappedUser }
    }

    const localResult = await signInLocalStudentAccount({
      email: validation.normalizedEmail,
      password,
    })

    if (localResult.ok) {
      setUser(localResult.user)
    }

    return localResult
  }, [])

  const signUp = useCallback(
    async ({ email, password, confirmPassword, fullName = '', institution = '' }) => {
      const validation = validateStudentEmail(email)
      if (!validation.valid) {
        return { ok: false, error: validation.error }
      }

      if (!password || password.length < 6) {
        return {
          ok: false,
          error: 'Password must be at least 6 characters long.',
        }
      }

      if (confirmPassword !== undefined && password !== confirmPassword) {
        return {
          ok: false,
          error: 'Passwords do not match.',
        }
      }

      const cleanFullName = fullName.trim()
      const cleanInstitution = institution.trim() || getEmailDomain(validation.normalizedEmail)

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: validation.normalizedEmail,
          password,
          options: {
            data: {
              full_name: cleanFullName,
              institution: cleanInstitution,
            },
          },
        })

        if (error) {
          return { ok: false, error: mapAuthErrorMessage(error.message) }
        }

        if (data?.session && data?.user) {
          const mappedUser = formatStudentUser(data.user)
          setUser(mappedUser)
          return { ok: true, requiresConfirmation: false, user: mappedUser }
        }

        return {
          ok: true,
          requiresConfirmation: true,
          message: 'Account created. Check your student email inbox to confirm, then sign in.',
        }
      }

      const localResult = await registerLocalStudentAccount({
        email: validation.normalizedEmail,
        password,
        fullName: cleanFullName,
        institution: cleanInstitution,
      })

      if (localResult.ok) {
        setUser(localResult.user)
      }

      return localResult
    },
    []
  )

  const signOut = useCallback(async () => {
    clearLocalStudentSession()
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        handleThemeChange,
        signIn,
        signUp,
        signOut,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
