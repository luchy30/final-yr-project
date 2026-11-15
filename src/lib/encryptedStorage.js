const KEY_DB_NAME = 'petroreserves-crypto-v1'
const KEY_STORE_NAME = 'keys'
const MASTER_KEY_ID = 'browser-storage-aes-gcm'
const CIPHER_PREFIX = 'enc.v1.'

const LEGACY_PLAINTEXT_KEYS = [
  'petroreserves-projects-v1',
  'petroreserves-active-project-v1',
  'petroreserves-local-students-v1',
  'petroreserves-local-session-v1',
]

const LEGACY_PLAINTEXT_PREFIXES = [
  'petroreserves-projects-v2:',
  'petroreserves-active-project-v2:',
]

let cachedKeyPromise = null
let hasPrunedLegacyKeys = false
const memoryFallbackStore = new Map()

function bytesToBase64(bytes) {
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function openKeyDatabase() {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(KEY_DB_NAME, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
          db.createObjectStore(KEY_STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
      request.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function readStoredCryptoKey(db) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(KEY_STORE_NAME, 'readonly')
      const req = tx.objectStore(KEY_STORE_NAME).get(MASTER_KEY_ID)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function writeStoredCryptoKey(db, key) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(KEY_STORE_NAME, 'readwrite')
      const req = tx.objectStore(KEY_STORE_NAME).put(key, MASTER_KEY_ID)
      req.onsuccess = () => resolve(true)
      req.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

async function getMasterKey() {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    return null
  }

  if (!cachedKeyPromise) {
    cachedKeyPromise = (async () => {
      const db = await openKeyDatabase()
      if (db) {
        const existing = await readStoredCryptoKey(db)
        if (existing) {
          return existing
        }
      }

      const generated = await subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )

      if (db) {
        await writeStoredCryptoKey(db, generated)
      }

      return generated
    })().catch(() => {
      cachedKeyPromise = null
      return null
    })
  }

  return cachedKeyPromise
}

export async function encryptText(plaintext) {
  const key = await getMasterKey()
  const subtle = globalThis.crypto?.subtle
  if (!key || !subtle || typeof TextEncoder === 'undefined') {
    return null
  }

  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(String(plaintext))
  const cipherBuffer = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const cipherBytes = new Uint8Array(cipherBuffer)

  const combined = new Uint8Array(iv.length + cipherBytes.length)
  combined.set(iv, 0)
  combined.set(cipherBytes, iv.length)

  return `${CIPHER_PREFIX}${bytesToBase64(combined)}`
}

export async function decryptText(payload) {
  if (typeof payload !== 'string' || !payload.startsWith(CIPHER_PREFIX)) {
    return null
  }

  const key = await getMasterKey()
  const subtle = globalThis.crypto?.subtle
  if (!key || !subtle || typeof TextDecoder === 'undefined') {
    return null
  }

  try {
    const raw = base64ToBytes(payload.slice(CIPHER_PREFIX.length))
    if (raw.length <= 12) return null
    const iv = raw.subarray(0, 12)
    const cipherBytes = raw.subarray(12)
    const plainBuffer = await subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes)
    return new TextDecoder().decode(plainBuffer)
  } catch {
    return null
  }
}

export function isEncryptedPayload(value) {
  return typeof value === 'string' && value.startsWith(CIPHER_PREFIX)
}

function pruneLegacyPlaintextKeys(storage) {
  if (hasPrunedLegacyKeys || !storage) return
  hasPrunedLegacyKeys = true
  try {
    for (const key of LEGACY_PLAINTEXT_KEYS) {
      storage.removeItem(key)
    }
    const keysToRemove = []
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i)
      if (!k) continue
      if (LEGACY_PLAINTEXT_PREFIXES.some((prefix) => k.startsWith(prefix))) {
        keysToRemove.push(k)
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k)
    }
  } catch {
    // Ignore storage inspection issues
  }
}

function getSafeStorage(kind) {
  try {
    if (kind === 'session' && typeof sessionStorage !== 'undefined') {
      return sessionStorage
    }
    if (kind === 'local' && typeof localStorage !== 'undefined') {
      pruneLegacyPlaintextKeys(localStorage)
      return localStorage
    }
  } catch {
    return null
  }
  return null
}

function createEncryptedStorageAdapter(kind = 'local') {
  return {
    async getItem(key) {
      const storage = getSafeStorage(kind)
      const memKey = `${kind}:${key}`

      if (!storage) {
        return memoryFallbackStore.get(memKey) ?? null
      }

      const raw = storage.getItem(key)
      if (!raw) {
        return null
      }

      if (!isEncryptedPayload(raw)) {
        storage.removeItem(key)
        return null
      }

      const decrypted = await decryptText(raw)
      if (decrypted === null) {
        storage.removeItem(key)
        return null
      }

      return decrypted
    },

    async setItem(key, value) {
      const text = String(value)
      const memKey = `${kind}:${key}`
      const encrypted = await encryptText(text)
      const storage = getSafeStorage(kind)

      if (!storage || !encrypted) {
        memoryFallbackStore.set(memKey, text)
        return
      }

      try {
        storage.setItem(key, encrypted)
      } catch {
        memoryFallbackStore.set(memKey, text)
      }
    },

    async removeItem(key) {
      const memKey = `${kind}:${key}`
      memoryFallbackStore.delete(memKey)
      const storage = getSafeStorage(kind)
      if (storage) {
        try {
          storage.removeItem(key)
        } catch {
          // Ignore storage removal errors
        }
      }
    },
  }
}

export const encryptedLocalStorage = createEncryptedStorageAdapter('local')
export const encryptedSessionStorage = createEncryptedStorageAdapter('session')
