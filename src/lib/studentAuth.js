import { supabase, isSupabaseConfigured } from './supabaseClient.js'
import { encryptedLocalStorage, encryptedSessionStorage } from './encryptedStorage.js'

const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i

const BLOCKED_PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.ca',
  'ymail.com',
  'rocketmail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'zoho.com',
  'gmx.com',
  'mail.com',
  'yandex.com',
  'tutanota.com',
  'fastmail.com',
])

const ACADEMIC_HOST_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2,4}$/i,
  /\.ac\.[a-z]{2,4}$/i,
  /\.sch\.[a-z]{2,4}$/i,
  /(?:^|\.)(?:student|students|stu|campus)\.[a-z0-9-]+(?:\.[a-z]{2,4})+$/i,
]

const GUEST_SESSION_KEY = 'petroreserves-guest-session-v1'
const REMEMBERED_LOGIN_KEY = 'petroreserves-remembered-login-v1'

export const GUEST_USER = {
  id: 'guest-preview',
  email: 'Guest Preview (Limited)',
  fullName: 'Guest Visitor',
  institution: 'Sample Reservoir Preview',
  isGuest: true,
}

function isBlockedDomain(domain) {
  for (const blocked of BLOCKED_PERSONAL_DOMAINS) {
    if (domain === blocked || domain.endsWith(`.${blocked}`)) {
      return true
    }
  }
  return false
}

export function validateStudentEmail(rawEmail) {
  const normalizedEmail = String(rawEmail || '').trim().toLowerCase()

  if (!normalizedEmail) {
    return {
      valid: false,
      normalizedEmail: '',
      error: 'Enter your student email address.',
    }
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      valid: false,
      normalizedEmail,
      error: 'Enter a valid email address.',
    }
  }

  const atIndex = normalizedEmail.lastIndexOf('@')
  const domain = normalizedEmail.slice(atIndex + 1)

  if (!domain || isBlockedDomain(domain)) {
    return {
      valid: false,
      normalizedEmail,
      error: 'Use your institutional student email (for example, @university.edu.ng, .edu, or .ac.uk). Personal webmail domains are not allowed.',
    }
  }

  const isAcademic = ACADEMIC_HOST_PATTERNS.some((pattern) => pattern.test(domain))
  if (!isAcademic) {
    return {
      valid: false,
      normalizedEmail,
      error: 'Use an official academic or student email domain ending in .edu, .edu.ng, .ac.uk, or your university domain.',
    }
  }

  return {
    valid: true,
    normalizedEmail,
    error: null,
  }
}

export function getEmailDomain(email) {
  const normalized = String(email || '').trim().toLowerCase()
  const atIndex = normalized.lastIndexOf('@')
  return atIndex > -1 ? normalized.slice(atIndex + 1) : ''
}

export function formatStudentUser(rawUser) {
  if (!rawUser) return null
  const metadata = rawUser.user_metadata || {}
  const email = rawUser.email || ''
  return {
    id: rawUser.id,
    email,
    fullName: (metadata.full_name || metadata.fullName || '').trim(),
    institution: (metadata.institution || '').trim() || getEmailDomain(email),
    isGuest: false,
  }
}

export async function loadGuestSessionFlag() {
  const val = await encryptedSessionStorage.getItem(GUEST_SESSION_KEY)
  return val === '1'
}

export async function saveGuestSessionFlag() {
  await encryptedSessionStorage.setItem(GUEST_SESSION_KEY, '1')
}

export async function clearGuestSessionFlag() {
  await encryptedSessionStorage.removeItem(GUEST_SESSION_KEY)
}

export async function loadRememberedLoginInfo() {
  const raw = await encryptedLocalStorage.getItem(REMEMBERED_LOGIN_KEY)
  if (!raw) return { rememberMe: true, email: '' }
  try {
    const parsed = JSON.parse(raw)
    return {
      rememberMe: parsed.rememberMe !== false,
      email: typeof parsed.email === 'string' ? parsed.email : '',
    }
  } catch {
    return { rememberMe: true, email: '' }
  }
}

export async function saveRememberedLoginInfo(email) {
  await encryptedLocalStorage.setItem(
    REMEMBERED_LOGIN_KEY,
    JSON.stringify({
      rememberMe: true,
      email: String(email || '').trim().toLowerCase(),
    })
  )
}

export async function clearRememberedLoginInfo() {
  await encryptedLocalStorage.removeItem(REMEMBERED_LOGIN_KEY)
}

export async function recordStudentLoginProfile({ fullName = '', institution = '' } = {}) {
  if (!isSupabaseConfigured || !supabase) return null
  try {
    await supabase.rpc('record_student_login', {
      p_full_name: fullName || null,
      p_institution: institution || null,
    })
  } catch {
    return null
  }
  return true
}

export async function fetchStudentLoginProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('id, email, full_name, institution, login_count, last_login_at, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return null
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || '',
      institution: data.institution || '',
      loginCount: data.login_count || 1,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
    }
  } catch {
    return null
  }
}
