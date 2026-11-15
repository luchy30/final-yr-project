import { useState, useEffect, useCallback, useRef } from 'react'
import { AuthContext } from './useAuth'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { encryptedLocalStorage } from '../lib/encryptedStorage'
import {
  GUEST_USER,
  validateStudentEmail,
  formatStudentUser,
  getEmailDomain,
  loadGuestSessionFlag,
  saveGuestSessionFlag,
  clearGuestSessionFlag,
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
  const [theme, setTheme] = useState('light')
  const userToggledThemeRef = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    encryptedLocalStorage.getItem('app-theme').then((savedTheme) => {
      if (controller.signal.aborted || userToggledThemeRef.current) return
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme)
      }
    })
    return () => {
      controller.abort()
    }
  }, [])

  const handleThemeChange = useCallback((newTheme) => {
    userToggledThemeRef.current = true
    setTheme(newTheme)
    void encryptedLocalStorage.setItem('app-theme', newTheme)
  }, [])

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    if (!isSupabaseConfigured || !supabase) {
      loadGuestSessionFlag().then((isGuestActive) => {
        if (controller.signal.aborted) return
        setUser(isGuestActive ? GUEST_USER : null)
        setLoading(false)
      })
      return () => {
        controller.abort()
      }
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const supabaseUser = formatStudentUser(data?.session?.user || null)
        if (supabaseUser) {
          await clearGuestSessionFlag()
          if (controller.signal.aborted) return
          setUser(supabaseUser)
          setLoading(false)
          return
        }

        const isGuestActive = await loadGuestSessionFlag()
        if (controller.signal.aborted) return
        setUser(isGuestActive ? GUEST_USER : null)
        setLoading(false)
      })
      .catch(async () => {
        const isGuestActive = await loadGuestSessionFlag()
        if (controller.signal.aborted) return
        setUser(isGuestActive ? GUEST_USER : null)
        setLoading(false)
      })

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const supabaseUser = formatStudentUser(session?.user || null)
      if (supabaseUser) {
        await clearGuestSessionFlag()
        if (controller.signal.aborted) return
        setUser(supabaseUser)
        setLoading(false)
        return
      }

      const isGuestActive = await loadGuestSessionFlag()
      if (controller.signal.aborted) return
      setUser(isGuestActive ? GUEST_USER : null)
      setLoading(false)
    })

    return () => {
      controller.abort()
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const enterGuestMode = useCallback(() => {
    void saveGuestSessionFlag()
    setUser(GUEST_USER)
    setLoading(false)
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const validation = validateStudentEmail(email)
    if (!validation.valid) {
      return { ok: false, error: validation.error }
    }

    if (!password) {
      return { ok: false, error: 'Enter your password.' }
    }

    if (!isSupabaseConfigured || !supabase) {
      return {
        ok: false,
        error: 'Cloud authentication is not configured for this environment yet.',
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.normalizedEmail,
      password,
    })

    if (error) {
      return { ok: false, error: mapAuthErrorMessage(error.message) }
    }

    await clearGuestSessionFlag()
    const mappedUser = formatStudentUser(data?.user || null)
    setUser(mappedUser)
    return { ok: true, user: mappedUser }
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

      if (!isSupabaseConfigured || !supabase) {
        return {
          ok: false,
          error: 'Cloud authentication is not configured for this environment yet.',
        }
      }

      const cleanFullName = fullName.trim()
      const cleanInstitution = institution.trim() || getEmailDomain(validation.normalizedEmail)

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

      await clearGuestSessionFlag()

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
    },
    []
  )

  const signOut = useCallback(async () => {
    await clearGuestSessionFlag()
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest: Boolean(user?.isGuest),
        loading,
        theme,
        handleThemeChange,
        enterGuestMode,
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
