import { supabase, isSupabaseConfigured } from './supabaseClient'
import { encryptedLocalStorage } from './encryptedStorage'

const ACTIVE_PROJECT_PREFIX = 'petroreserves-active-project-id'

function getActiveProjectKey(userId) {
  return `${ACTIVE_PROJECT_PREFIX}:${userId}`
}

export async function loadActiveProjectIdPreference(userId) {
  if (!userId) return null
  return encryptedLocalStorage.getItem(getActiveProjectKey(userId))
}

export async function saveActiveProjectIdPreference(projectId, userId) {
  if (!userId || !projectId) return
  await encryptedLocalStorage.setItem(getActiveProjectKey(userId), projectId)
}

export async function fetchRemoteProjects(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { projects: null, skipped: true, error: null }
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, name, description, inputs, active_chart_tab, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    return { projects: null, skipped: false, error: error.message }
  }

  const mapped = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || '',
    inputs: row.inputs,
    activeChartTab: row.active_chart_tab || 'pz',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return { projects: mapped, skipped: false, error: null }
}

export async function upsertRemoteProject(project, userId) {
  if (!isSupabaseConfigured || !supabase || !project || !userId) {
    return { ok: false, skipped: true, error: null }
  }

  const payload = {
    id: project.id,
    user_id: userId,
    name: project.name,
    description: project.description || '',
    inputs: project.inputs,
    active_chart_tab: project.activeChartTab || 'pz',
    created_at: project.createdAt || new Date().toISOString(),
    updated_at: project.updatedAt || new Date().toISOString(),
  }

  const { error } = await supabase
    .from('projects')
    .upsert(payload, { onConflict: 'id' })

  if (error) {
    return { ok: false, skipped: false, error: error.message }
  }

  return { ok: true, skipped: false, error: null }
}

export async function deleteRemoteProject(projectId, userId) {
  if (!isSupabaseConfigured || !supabase || !projectId || !userId) {
    return { ok: false, skipped: true, error: null }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId)

  if (error) {
    return { ok: false, skipped: false, error: error.message }
  }

  return { ok: true, skipped: false, error: null }
}
