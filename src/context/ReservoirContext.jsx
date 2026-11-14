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
  loadLocalProjects,
  saveLocalProjects,
  loadLocalActiveProjectId,
  saveLocalActiveProjectId,
  fetchRemoteProjects,
  upsertRemoteProject,
  deleteRemoteProject,
} from '../lib/projectStorage'
import { isSupabaseConfigured } from '../lib/supabaseClient'

function createProjectId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ReservoirProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme')
    return saved || 'light'
  })

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
  }

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [projects, setProjects] = useState(() => {
    const local = loadLocalProjects()
    if (local) {
      return local.map(normalizeProject)
    }
    return STARTER_PROJECTS.map(normalizeProject)
  })

  const initialProjectsRef = useRef(projects)

  const [activeProjectId, setActiveProjectId] = useState(() => {
    const savedId = loadLocalActiveProjectId()
    const initialList = loadLocalProjects() || STARTER_PROJECTS
    if (savedId && initialList.some((p) => p.id === savedId)) {
      return savedId
    }
    return initialList[0].id
  })

  const [storageStatus, setStorageStatus] = useState({
    mode: isSupabaseConfigured ? 'supabase' : 'local',
    syncing: false,
    error: null,
  })

  useEffect(() => {
    saveLocalProjects(projects)
  }, [projects])

  useEffect(() => {
    saveLocalActiveProjectId(activeProjectId)
  }, [activeProjectId])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const controller = new AbortController()
    const syncInitial = async () => {
      setStorageStatus({ mode: 'supabase', syncing: true, error: null })
      const res = await fetchRemoteProjects()
      if (controller.signal.aborted) return

      if (res.error) {
        setStorageStatus({ mode: 'supabase', syncing: false, error: res.error })
        return
      }

      if (res.projects && res.projects.length > 0) {
        const normalized = res.projects.map(normalizeProject)
        setProjects(normalized)
        setActiveProjectId((prevId) =>
          normalized.some((p) => p.id === prevId) ? prevId : normalized[0].id
        )
      } else {
        await Promise.all(
          initialProjectsRef.current.map((proj) => upsertRemoteProject(proj))
        )
      }

      setStorageStatus({ mode: 'supabase', syncing: false, error: null })
    }

    syncInitial()
    return () => {
      controller.abort()
    }
  }, [])

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0]
  }, [projects, activeProjectId])

  const updateActiveProjectInputs = useCallback(
    (patch) => {
      const now = new Date().toISOString()
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === activeProject.id
            ? {
                ...proj,
                inputs: { ...proj.inputs, ...patch },
                updatedAt: now,
              }
            : proj
        )
      )
    },
    [activeProject.id]
  )

  const makeFieldSetter = (key) => (val) => {
    updateActiveProjectInputs({ [key]: val })
  }

  const activeInputs = activeProject.inputs
  const activeChartTab = activeProject.activeChartTab || 'pz'

  const setActiveChartTab = (tabKey) => {
    const now = new Date().toISOString()
    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === activeProject.id
          ? { ...proj, activeChartTab: tabKey, updatedAt: now }
          : proj
      )
    )
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

    const updatedProject = {
      ...activeProject,
      inputs: nextInputs,
      updatedAt: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      upsertRemoteProject(updatedProject).then((res) => {
        if (!res.ok && !res.skipped) {
          setStorageStatus((prev) => ({ ...prev, error: res.error || null }))
        }
      })
    }
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

  const createProject = ({ name, description = '', templateKey = 'dry_gas', fieldStage }) => {
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
      upsertRemoteProject(newProject)
    }

    return newProject
  }

  const updateProjectDetails = (projectId, { name, description }) => {
    const target = projects.find((p) => p.id === projectId)
    if (!target) return

    const updatedTarget = {
      ...target,
      name: name !== undefined ? name : target.name,
      description: description !== undefined ? description : target.description,
      updatedAt: new Date().toISOString(),
    }

    setProjects((prev) =>
      prev.map((proj) => (proj.id === projectId ? updatedTarget : proj))
    )

    if (isSupabaseConfigured) {
      upsertRemoteProject(updatedTarget)
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
      deleteRemoteProject(projectId)
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
    setGor: makeFieldSetter('gor'),
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
    setDeclineModel: makeFieldSetter('declineModel'),
    fieldStage: activeInputs.fieldStage,
    setFieldStage: makeFieldSetter('fieldStage'),
    initialRate: activeInputs.initialRate,
    setInitialRate: makeFieldSetter('initialRate'),
    declineRate: activeInputs.declineRate,
    setDeclineRate: makeFieldSetter('declineRate'),
    arpsB: activeInputs.arpsB,
    setArpsB: makeFieldSetter('arpsB'),
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
