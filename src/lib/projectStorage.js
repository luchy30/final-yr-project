import { supabase, isSupabaseConfigured } from './supabaseClient'
import { encryptedLocalStorage } from './encryptedStorage'

const ACTIVE_PROJECT_KEY = 'petroreserves-active-project-id'

export async function loadActiveProjectIdPreference() {
  return encryptedLocalStorage.getItem(ACTIVE_PROJECT_KEY)
}

export async function saveActiveProjectIdPreference(projectId) {
  if (!projectId) return
  await encryptedLocalStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
}

export async function fetchRemoteProjects() {
  if (!isSupabaseConfigured || !supabase) {
    return { projects: null, skipped: true, error: null }
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, inputs, active_chart_tab, created_at, updated_at')
    .order('created_at', { ascending: true })

  if (error) {
    return { projects: null, skipped: false, error: error.message }
  }

  const mapped = (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    inputs: row.inputs,
    activeChartTab: row.active_chart_tab || 'pz',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return { projects: mapped, skipped: false, error: null }
}

export async function upsertRemoteProject(project) {
  if (!isSupabaseConfigured || !supabase || !project) {
    return { ok: false, skipped: true, error: null }
  }

  const payload = {
    id: project.id,
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

export async function deleteRemoteProject(projectId) {
  if (!isSupabaseConfigured || !supabase || !projectId) {
    return { ok: false, skipped: true, error: null }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    return { ok: false, skipped: false, error: error.message }
  }

  return { ok: true, skipped: false, error: null }
}
