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

const LOCAL_USERS_KEY = 'petroreserves-local-students-v1'
const LOCAL_SESSION_KEY = 'petroreserves-local-session-v1'

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
  }
}

async function hashLocalPassword(password) {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    const encoded = new TextEncoder().encode(password)
    const digest = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  return btoa(unescape(encodeURIComponent(password)))
}

function loadLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLocalStudentSession() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && parsed.id && parsed.email ? parsed : null
  } catch {
    return null
  }
}

function saveLocalStudentSession(user) {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user))
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalStudentSession() {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY)
  } catch {
    // Ignore storage quota errors
  }
}

function createLocalUserId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `stu-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function registerLocalStudentAccount({ email, password, fullName = '', institution = '' }) {
  const users = loadLocalUsers()
  const existing = users.find((item) => item.email === email)
  if (existing) {
    return {
      ok: false,
      error: 'An account with this student email already exists. Sign in instead.',
    }
  }

  const passwordHash = await hashLocalPassword(password)
  const record = {
    id: createLocalUserId(),
    email,
    fullName: fullName.trim(),
    institution: institution.trim() || getEmailDomain(email),
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  saveLocalUsers([...users, record])
  const sessionUser = formatStudentUser(record)
  saveLocalStudentSession(sessionUser)

  return {
    ok: true,
    requiresConfirmation: false,
    user: sessionUser,
  }
}

export async function signInLocalStudentAccount({ email, password }) {
  const users = loadLocalUsers()
  const record = users.find((item) => item.email === email)
  if (!record) {
    return {
      ok: false,
      error: 'No local student account found for this email. Create a student account first.',
    }
  }

  const passwordHash = await hashLocalPassword(password)
  if (record.passwordHash !== passwordHash) {
    return {
      ok: false,
      error: 'Incorrect student email or password.',
    }
  }

  const sessionUser = formatStudentUser(record)
  saveLocalStudentSession(sessionUser)

  return {
    ok: true,
    user: sessionUser,
  }
}
