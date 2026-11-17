import { useState, useEffect, useCallback, useRef } from 'react'
import { AuthContext } from './useAuth'
import { supabase, isSupabaseConfigured, setAuthPersistenceMode } from '../lib/supabaseClient'
import { encryptedLocalStorage } from '../lib/encryptedStorage'
import {
  GUEST_USER,
  validateStudentEmail,
  formatStudentUser,
  getEmailDomain,
  loadGuestSessionFlag,
  saveGuestSessionFlag,
  clearGuestSessionFlag,
  loadRememberedLoginInfo,
  saveRememberedLoginInfo,
  clearRememberedLoginInfo,
  recordStudentLoginProfile,
  fetchStudentLoginProfile,
} from '../lib/studentAuth'

function mapAuthErrorMessage(rawMessage) {
  const message = String(rawMessage || '')
  if (/invalid login credentials/i.test(message)) {
    return 'Incorrect email or password.'
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirm your email before signing in.'
  }
  if (/user already registered/i.test(message)) {
    return 'An account with this email already exists. Sign in instead.'
  }
  return message || 'Authentication failed. Check your account details and try again.'
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
  const [studentProfile, setStudentProfile] = useState(null)
  const [rememberedLogin, setRememberedLogin] = useState({ rememberMe: true, email: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const initAuth = async () => {
      const remembered = await loadRememberedLoginInfo()
      if (controller.signal.aborted) return
      setRememberedLogin(remembered)
      setAuthPersistenceMode(remembered.rememberMe)

      if (!isSupabaseConfigured || !supabase) {
        const isGuestActive = await loadGuestSessionFlag()
        if (controller.signal.aborted) return
        setUser(isGuestActive ? GUEST_USER : null)
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase.auth.getSession()
        const supabaseUser = formatStudentUser(data?.session?.user || null)
        if (supabaseUser) {
          await clearGuestSessionFlag()
          const profile = await fetchStudentLoginProfile(supabaseUser.id)
          if (controller.signal.aborted) return
          setUser(supabaseUser)
          setStudentProfile(profile)
          setLoading(false)
          return
        }
      } catch {
        // Fallback cleanly to guest check if session hydration fails
      }

      const isGuestActive = await loadGuestSessionFlag()
      if (controller.signal.aborted) return
      setUser(isGuestActive ? GUEST_USER : null)
      setStudentProfile(null)
      setLoading(false)
    }

    initAuth()

    if (!isSupabaseConfigured || !supabase) {
      return () => {
        controller.abort()
      }
    }

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
      setStudentProfile(null)
      setLoading(false)
    })

    return () => {
      controller.abort()
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const enterGuestMode = useCallback(() => {
    void saveGuestSessionFlag()
    setStudentProfile(null)
    setUser(GUEST_USER)
    setLoading(false)
  }, [])

  const signIn = useCallback(async ({ email, password, rememberMe = true }) => {
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

    setAuthPersistenceMode(rememberMe)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validation.normalizedEmail,
      password,
    })

    if (error) {
      return { ok: false, error: mapAuthErrorMessage(error.message) }
    }

    await clearGuestSessionFlag()

    if (rememberMe) {
      await saveRememberedLoginInfo(validation.normalizedEmail)
      setRememberedLogin({ rememberMe: true, email: validation.normalizedEmail })
    } else {
      await clearRememberedLoginInfo()
      setRememberedLogin({ rememberMe: false, email: '' })
    }

    const mappedUser = formatStudentUser(data?.user || null)
    if (mappedUser) {
      await recordStudentLoginProfile({
        fullName: mappedUser.fullName,
        institution: mappedUser.institution,
      })
      const profile = await fetchStudentLoginProfile(mappedUser.id)
      setStudentProfile(profile)
    }

    setUser(mappedUser)
    return { ok: true, user: mappedUser }
  }, [])

  const signUp = useCallback(
    async ({
      email,
      password,
      confirmPassword,
      fullName = '',
      institution = '',
      rememberMe = true,
    }) => {
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

      setAuthPersistenceMode(rememberMe)

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

      if (rememberMe) {
        await saveRememberedLoginInfo(validation.normalizedEmail)
        setRememberedLogin({ rememberMe: true, email: validation.normalizedEmail })
      } else {
        await clearRememberedLoginInfo()
        setRememberedLogin({ rememberMe: false, email: '' })
      }

      if (data?.session && data?.user) {
        const mappedUser = formatStudentUser(data.user)
        const profile = await fetchStudentLoginProfile(mappedUser.id)
        setStudentProfile(profile)
        setUser(mappedUser)
        return { ok: true, requiresConfirmation: false, user: mappedUser }
      }

      return {
        ok: true,
        requiresConfirmation: true,
        message: 'Account created. Check your email inbox to confirm, then sign in.',
      }
    },
    []
  )

  const signOut = useCallback(async () => {
    await clearGuestSessionFlag()
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setStudentProfile(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        rememberedLogin,
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
