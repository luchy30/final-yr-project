import { supabase, isSupabaseConfigured } from './supabaseClient'

const PROJECTS_STORAGE_KEY = 'petroreserves-projects-v1'
const ACTIVE_PROJECT_KEY = 'petroreserves-active-project-v1'

export function loadLocalProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export function saveLocalProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  } catch {
    // Ignore storage quota issues
  }
}

export function loadLocalActiveProjectId() {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY)
  } catch {
    return null
  }
}

export function saveLocalActiveProjectId(projectId) {
  try {
    if (projectId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
    }
  } catch {
    // Ignore storage quota issues
  }
}

export async function fetchRemoteProjects() {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false, projects: null, error: null }
  }

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, inputs, active_chart_tab, created_at, updated_at')
      .order('created_at', { ascending: true })

    if (error) {
      return { configured: true, projects: null, error: error.message }
    }

    return { configured: true, projects: data, error: null }
  } catch (err) {
    return {
      configured: true,
      projects: null,
      error: err instanceof Error ? err.message : 'Failed to connect to Supabase',
    }
  }
}

export async function upsertRemoteProject(project) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, skipped: true }
  }

  try {
    const { error } = await supabase.from('projects').upsert(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        inputs: project.inputs,
        active_chart_tab: project.activeChartTab,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
      },
      { onConflict: 'id' }
    )
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to save project to Supabase',
    }
  }
}

export async function deleteRemoteProject(projectId) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, skipped: true }
  }

  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to delete project from Supabase',
    }
  }
}
