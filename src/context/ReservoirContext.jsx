import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  DEFAULT_INPUTS,
  PROJECT_TEMPLATES,
  STARTER_PROJECTS,
  normalizeInputs,
  normalizeProject,
  getZMethodLabel,
  computeCompleteResults,
} from '../utils/reservoirEngine'
import { ReservoirContext } from './useReservoir'
import {
  loadActiveProjectIdPreference,
  saveActiveProjectIdPreference,
  fetchRemoteProjects,
  upsertRemoteProject,
  deleteRemoteProject,
} from '../lib/projectStorage'
import { encryptedLocalStorage } from '../lib/encryptedStorage'
import { isSupabaseConfigured } from '../lib/supabaseClient'

function createProjectId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ReservoirProvider({ children }) {
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

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [projects, setProjects] = useState(() =>
    STARTER_PROJECTS.map(normalizeProject)
  )

  const [activeProjectId, setActiveProjectId] = useState(() => projects[0].id)

  const [storageStatus, setStorageStatus] = useState({
    mode: isSupabaseConfigured ? 'supabase' : 'memory',
    syncing: isSupabaseConfigured,
    error: null,
  })

  const projectsRef = useRef(projects)
  const remoteSyncTimerRef = useRef(null)

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    void saveActiveProjectIdPreference(activeProjectId)
  }, [activeProjectId])

  useEffect(() => {
    return () => {
      if (remoteSyncTimerRef.current) {
        clearTimeout(remoteSyncTimerRef.current)
      }
    }
  }, [])

  const syncProjectToSupabase = useCallback((project) => {
    if (!isSupabaseConfigured || !project) return
    upsertRemoteProject(project).then((res) => {
      if (!res.ok && !res.skipped) {
        setStorageStatus((prev) => ({ ...prev, error: res.error || null }))
      } else if (res.ok) {
        setStorageStatus((prev) => (prev.error ? { ...prev, error: null } : prev))
      }
    })
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    const controller = new AbortController()
    const syncInitial = async () => {
      const [res, savedPref] = await Promise.all([
        fetchRemoteProjects(),
        loadActiveProjectIdPreference(),
      ])
      if (controller.signal.aborted) return

      if (res.error) {
        setStorageStatus({ mode: 'supabase', syncing: false, error: res.error })
        return
      }

      if (res.projects && res.projects.length > 0) {
        const normalized = res.projects.map(normalizeProject)
        setProjects(normalized)
        setActiveProjectId((prevId) => {
          const candidate = savedPref || prevId
          return normalized.some((p) => p.id === candidate) ? candidate : normalized[0].id
        })
        setStorageStatus({ mode: 'supabase', syncing: false, error: null })
      } else {
        const starters = STARTER_PROJECTS.map(normalizeProject)
        const seedResults = await Promise.all(
          starters.map((proj) => upsertRemoteProject(proj))
        )
        if (controller.signal.aborted) return
        setProjects(starters)
        if (savedPref && starters.some((p) => p.id === savedPref)) {
          setActiveProjectId(savedPref)
        }
        const failed = seedResults.find((item) => !item.ok && !item.skipped)
        setStorageStatus({
          mode: 'supabase',
          syncing: false,
          error: failed ? failed.error || null : null,
        })
      }
    }

    syncInitial()
    return () => {
      controller.abort()
    }
  }, [])

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0]
  }, [projects, activeProjectId])

  const scheduleProjectSync = useCallback(
    (projectId) => {
      if (!isSupabaseConfigured) return
      if (remoteSyncTimerRef.current) {
        clearTimeout(remoteSyncTimerRef.current)
      }
      remoteSyncTimerRef.current = setTimeout(() => {
        const latest = projectsRef.current.find((p) => p.id === projectId)
        if (latest) {
          syncProjectToSupabase(latest)
        }
      }, 450)
    },
    [syncProjectToSupabase]
  )

  const updateActiveProjectInputs = useCallback(
    (patch) => {
      const targetId = activeProject.id
      const now = new Date().toISOString()
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === targetId
            ? {
                ...proj,
                inputs: { ...proj.inputs, ...patch },
                updatedAt: now,
              }
            : proj
        )
      )
      scheduleProjectSync(targetId)
    },
    [activeProject.id, scheduleProjectSync]
  )

  const makeFieldSetter = (key) => (val) => {
    updateActiveProjectInputs({ [key]: val })
  }

  const handleSetGor = (val) => {
    const parsed = parseFloat(val)
    if (Number.isFinite(parsed) && parsed > 0) {
      updateActiveProjectInputs({ gor: val, cgr: (1e6 / parsed).toFixed(2) })
    } else if (val === '0') {
      updateActiveProjectInputs({ gor: '0', cgr: '0' })
    } else {
      updateActiveProjectInputs({ gor: val })
    }
  }

  const handleSetCgr = (val) => {
    const parsed = parseFloat(val)
    if (Number.isFinite(parsed) && parsed > 0) {
      updateActiveProjectInputs({ cgr: val, gor: String(Math.round(1e6 / parsed)) })
    } else if (val === '0') {
      updateActiveProjectInputs({ cgr: '0', gor: '0' })
    } else {
      updateActiveProjectInputs({ cgr: val })
    }
  }

  const handleSetDeclineModel = (nextModel) => {
    if (nextModel === 'exponential') {
      updateActiveProjectInputs({ declineModel: nextModel, arpsB: '0' })
    } else if (nextModel === 'harmonic') {
      updateActiveProjectInputs({ declineModel: nextModel, arpsB: '1' })
    } else {
      const currentB = parseFloat(activeInputs.arpsB)
      const nextB =
        Number.isFinite(currentB) && currentB > 0 && currentB < 1
          ? activeInputs.arpsB
          : '0.5'
      updateActiveProjectInputs({ declineModel: nextModel, arpsB: nextB })
    }
  }

  const activeInputs = activeProject.inputs
  const activeChartTab = activeProject.activeChartTab || 'pz'

  const setActiveChartTab = (tabKey) => {
    const targetId = activeProject.id
    const now = new Date().toISOString()
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === targetId
          ? { ...proj, activeChartTab: tabKey, updatedAt: now }
          : proj
      )
    )
    scheduleProjectSync(targetId)
  }

  const projectResultsById = useMemo(() => {
    const map = {}
    for (const proj of projects) {
      map[proj.id] = computeCompleteResults(proj.inputs)
    }
    return map
  }, [projects])

  const results = projectResultsById[activeProject.id] || computeCompleteResults(activeInputs)

  const handleCalculate = (overrideInputsOrEvent) => {
    let nextInputs = activeInputs
    if (
      overrideInputsOrEvent &&
      typeof overrideInputsOrEvent.preventDefault === 'function'
    ) {
      overrideInputsOrEvent.preventDefault()
    } else if (
      overrideInputsOrEvent &&
      typeof overrideInputsOrEvent === 'object' &&
      'area' in overrideInputsOrEvent
    ) {
      nextInputs = normalizeInputs(overrideInputsOrEvent)
      updateActiveProjectInputs(nextInputs)
    }

    if (remoteSyncTimerRef.current) {
      clearTimeout(remoteSyncTimerRef.current)
    }

    const updatedProject = {
      ...activeProject,
      inputs: nextInputs,
      updatedAt: new Date().toISOString(),
    }

    syncProjectToSupabase(updatedProject)
  }

  const resetProjectDefaults = () => {
    const defaults = { ...DEFAULT_INPUTS }
    handleCalculate(defaults)
  }

  const switchProject = (projectId) => {
    if (projects.some((p) => p.id === projectId)) {
      setActiveProjectId(projectId)
    }
  }

  const createProject = ({ name, description = '', templateKey = 'custom', fieldStage }) => {
    const cleanName = (name || '').trim() || `Gas Field Study ${projects.length + 1}`
    const cleanDesc = (description || '').trim()

    let baseInputs = { ...DEFAULT_INPUTS }
    if (templateKey === 'clone') {
      baseInputs = { ...activeProject.inputs }
    } else if (PROJECT_TEMPLATES[templateKey]) {
      baseInputs = { ...PROJECT_TEMPLATES[templateKey].inputs }
    }

    if (fieldStage) {
      baseInputs.fieldStage = fieldStage
    }

    const now = new Date().toISOString()
    const newProject = normalizeProject({
      id: createProjectId(),
      name: cleanName,
      description:
        cleanDesc ||
        (PROJECT_TEMPLATES[templateKey]
          ? PROJECT_TEMPLATES[templateKey].description
          : 'Custom reservoir engineering study workspace.'),
      inputs: baseInputs,
      activeChartTab: 'pz',
      createdAt: now,
      updatedAt: now,
    })

    setProjects((prev) => [...prev, newProject])
    setActiveProjectId(newProject.id)

    if (isSupabaseConfigured) {
      upsertRemoteProject(newProject).then((res) => {
        setStorageStatus((prev) => ({ ...prev, error: res.error || null }))
      })
    }

    return newProject
  }

  const updateProjectDetails = (projectId, { name, description }) => {
    const target = projects.find((p) => p.id === projectId)
    if (!target) return

    const nextName = name !== undefined ? name.trim() || target.name : target.name
    const nextDesc = description !== undefined ? description.trim() : target.description

    const updatedTarget = {
      ...target,
      name: nextName,
      description: nextDesc,
      updatedAt: new Date().toISOString(),
    }

    setProjects((prev) =>
      prev.map((proj) => (proj.id === projectId ? updatedTarget : proj))
    )

    if (isSupabaseConfigured) {
      upsertRemoteProject(updatedTarget).then((res) => {
        setStorageStatus((prev) => ({ ...prev, error: res.error || null }))
      })
    }
  }

  const deleteProject = (projectId) => {
    if (projects.length <= 1) return false
    const remaining = projects.filter((p) => p.id !== projectId)
    setProjects(remaining)
    if (activeProjectId === projectId) {
      setActiveProjectId(remaining[0].id)
    }
    if (isSupabaseConfigured) {
      deleteRemoteProject(projectId).then((res) => {
        setStorageStatus((prev) => ({ ...prev, error: res.error || null }))
      })
    }
    return true
  }

  const driveIndicesData = useMemo(() => {
    return [
      {
        name: 'Gas Expansion (GDI and IDD)',
        value: Math.max(0.01, results.mbeRes.IDD),
        color: '#059669',
        percentage: (results.mbeRes.IDD * 100).toFixed(1),
      },
      {
        name: 'Water Influx (WDI and IWD)',
        value: Math.max(0.01, results.mbeRes.IWD),
        color: '#34d399',
        percentage: (results.mbeRes.IWD * 100).toFixed(1),
      },
      {
        name: 'Rock and Fluid (CDI and ICD)',
        value: Math.max(0.01, results.mbeRes.ICD),
        color: '#a7f3d0',
        percentage: (results.mbeRes.ICD * 100).toFixed(1),
      },
    ]
  }, [results.mbeRes.IDD, results.mbeRes.IWD, results.mbeRes.ICD])

  const chartThemeStyles = useMemo(() => {
    return {
      tooltip: {
        backgroundColor: theme === 'dark' ? '#163632' : '#111827',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.5rem 0.8rem',
      },
      axisStroke: theme === 'dark' ? '#475569' : '#9ca3af',
      tickFill: theme === 'dark' ? '#94a3b8' : '#6b7280',
      contrastLine: theme === 'dark' ? '#f9fafb' : '#111827',
    }
  }, [theme])

  const contextValue = {
    theme,
    handleThemeChange,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    searchQuery,
    setSearchQuery,
    activeChartTab,
    setActiveChartTab,
    projects,
    activeProject,
    activeProjectId,
    projectResultsById,
    switchProject,
    createProject,
    updateProjectDetails,
    deleteProject,
    storageStatus,
    area: activeInputs.area,
    setArea: makeFieldSetter('area'),
    thickness: activeInputs.thickness,
    setThickness: makeFieldSetter('thickness'),
    porosity: activeInputs.porosity,
    setPorosity: makeFieldSetter('porosity'),
    waterSat: activeInputs.waterSat,
    setWaterSat: makeFieldSetter('waterSat'),
    residualGasSat: activeInputs.residualGasSat,
    setResidualGasSat: makeFieldSetter('residualGasSat'),
    pressure: activeInputs.pressure,
    setPressure: makeFieldSetter('pressure'),
    abandonmentPressure: activeInputs.abandonmentPressure,
    setAbandonmentPressure: makeFieldSetter('abandonmentPressure'),
    temperature: activeInputs.temperature,
    setTemperature: makeFieldSetter('temperature'),
    gasGravity: activeInputs.gasGravity,
    setGasGravity: makeFieldSetter('gasGravity'),
    gor: activeInputs.gor,
    setGor: handleSetGor,
    cgr: activeInputs.cgr,
    setCgr: handleSetCgr,
    apiGravity: activeInputs.apiGravity,
    setApiGravity: makeFieldSetter('apiGravity'),
    zMethod: activeInputs.zMethod,
    setZMethod: makeFieldSetter('zMethod'),
    pseudoMethod: activeInputs.pseudoMethod,
    setPseudoMethod: makeFieldSetter('pseudoMethod'),
    classificationCriterion: activeInputs.classificationCriterion,
    setClassificationCriterion: makeFieldSetter('classificationCriterion'),
    driveMechanism: activeInputs.driveMechanism,
    setDriveMechanism: makeFieldSetter('driveMechanism'),
    aquiferModel: activeInputs.aquiferModel,
    setAquiferModel: makeFieldSetter('aquiferModel'),
    declineModel: activeInputs.declineModel,
    setDeclineModel: handleSetDeclineModel,
    fieldStage: activeInputs.fieldStage,
    setFieldStage: makeFieldSetter('fieldStage'),
    initialRate: activeInputs.initialRate,
    setInitialRate: makeFieldSetter('initialRate'),
    declineRate: activeInputs.declineRate,
    setDeclineRate: makeFieldSetter('declineRate'),
    arpsB: activeInputs.arpsB,
    setArpsB: makeFieldSetter('arpsB'),
    providedZi: activeInputs.providedZi ?? '',
    setProvidedZi: makeFieldSetter('providedZi'),
    providedZa: activeInputs.providedZa ?? '',
    setProvidedZa: makeFieldSetter('providedZa'),
    targetDepletionYears: activeInputs.targetDepletionYears ?? '',
    setTargetDepletionYears: makeFieldSetter('targetDepletionYears'),
    forecastGiipBscf: activeInputs.forecastGiipBscf ?? '',
    setForecastGiipBscf: makeFieldSetter('forecastGiipBscf'),
    economicLimit: activeInputs.economicLimit,
    setEconomicLimit: makeFieldSetter('economicLimit'),
    results,
    handleCalculate,
    resetProjectDefaults,
    getZMethodLabel,
    driveIndicesData,
    chartThemeStyles,
  }

  return (
    <ReservoirContext.Provider value={contextValue}>
      {children}
    </ReservoirContext.Provider>
  )
}
