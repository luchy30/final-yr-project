import { createClient } from '@supabase/supabase-js'
import { encryptedLocalStorage, encryptedSessionStorage } from './encryptedStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let authPersistenceMode = 'local'

export function setAuthPersistenceMode(rememberLogin) {
  authPersistenceMode = rememberLogin ? 'local' : 'session'
}

const dynamicEncryptedAuthStorage = {
  async getItem(key) {
    const localVal = await encryptedLocalStorage.getItem(key)
    if (localVal !== null) {
      return localVal
    }
    return encryptedSessionStorage.getItem(key)
  },

  async setItem(key, value) {
    if (authPersistenceMode === 'session') {
      await encryptedSessionStorage.setItem(key, value)
      await encryptedLocalStorage.removeItem(key)
      return
    }
    await encryptedLocalStorage.setItem(key, value)
    await encryptedSessionStorage.removeItem(key)
  },

  async removeItem(key) {
    await Promise.all([
      encryptedLocalStorage.removeItem(key),
      encryptedSessionStorage.removeItem(key),
    ])
  },
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: dynamicEncryptedAuthStorage,
      },
    })
  : null
