import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Add01Icon,
  ArrowLeftRightIcon,
  Calculator01Icon,
  Cancel01Icon,
  ChartLineData01Icon,
  Delete02Icon,
  Tick02Icon,
} from 'hugeicons-react'
import { useReservoir } from '../context/useReservoir'
import { PROJECT_TEMPLATES } from '../utils/reservoirEngine'
import CustomSelect from '../components/CustomSelect'

export function ProjectsPage() {
  const navigate = useNavigate()
  const {
    theme,
    projects,
    activeProjectId,
    projectResultsById,
    switchProject,
    createProject,
    deleteProject,
    searchQuery,
  } = useReservoir()

  const [isCreating, setIsCreating] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [descriptionInput, setDescriptionInput] = useState('')
  const [templateKey, setTemplateKey] = useState('dry_gas')
  const [stageInput, setStageInput] = useState('producing')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const nameInputRef = useRef(null)

  const closeModal = () => {
    setIsCreating(false)
  }

  useEffect(() => {
    if (!isCreating) return

    const focusTimer = setTimeout(() => {
      nameInputRef.current?.focus({ preventScroll: true })
    }, 60)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCreating])

  const handleCreate = (openCalculations) => {
    createProject({
      name: nameInput,
      description: descriptionInput,
      templateKey,
      fieldStage: stageInput,
    })
    setNameInput('')
    setDescriptionInput('')
    setTemplateKey('dry_gas')
    setStageInput('producing')
    setIsCreating(false)
    if (openCalculations) {
      navigate('/calculations')
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleProjects = projects.filter((proj) => {
    if (!normalizedQuery) return true
    return (
      proj.name.toLowerCase().includes(normalizedQuery) ||
      proj.description.toLowerCase().includes(normalizedQuery)
    )
  })

  return (
    <motion.div
      key="projects-page"
      className="evaluation-view-container"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="projects-header-row">
        <div>
          <h2 className="form-block-heading" style={{ marginTop: 0 }}>
            Reservoir Evaluation Projects
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Create and toggle between independent field workspaces. Each project keeps its own inputs, charts, forecast, and report.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="top-action-btn"
        >
          <Add01Icon size={16} />
          <span>Create Project</span>
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isCreating && (
            <motion.div
              key="create-project-overlay"
              className={`modal-overlay theme-${theme}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  closeModal()
                }
              }}
            >
              <motion.div
                key="create-project-dialog"
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-project-modal-title"
                initial={{ opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="modal-header-row">
                  <div>
                    <h3 id="create-project-modal-title" className="modal-title">
                      New Field Workspace
                    </h3>
                    <p className="modal-subtitle">
                      Set up a separate reservoir project with its own petrophysics, fluid properties, decline forecast, and report.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="modal-close-btn"
                    aria-label="Close modal"
                    title="Close"
                  >
                    <Cancel01Icon size={18} />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleCreate(true)
                  }}
                >
                  <div className="modal-form-grid">
                    <div className="input-cell">
                      <label htmlFor="new-project-name">Field or Project Name</label>
                      <input
                        ref={nameInputRef}
                        id="new-project-name"
                        type="text"
                        placeholder="e.g. Agbami Gas Block D"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="standard-input"
                        required
                      />
                    </div>

                    <div className="input-cell">
                      <label htmlFor="new-project-template">Starting Parameter Preset</label>
                      <CustomSelect
                        id="new-project-template"
                        value={templateKey}
                        onChange={setTemplateKey}
                        options={[
                          ...Object.entries(PROJECT_TEMPLATES).map(([key, tpl]) => ({
                            value: key,
                            label: tpl.label,
                          })),
                          { value: 'clone', label: 'Copy Active Workspace Inputs' },
                        ]}
                      />
                    </div>

                    <div className="input-cell">
                      <label htmlFor="new-project-stage">Field Development Stage</label>
                      <CustomSelect
                        id="new-project-stage"
                        value={stageInput}
                        onChange={setStageInput}
                        options={[
                          { value: 'early', label: 'Early Appraisal (Volumetric Basis)' },
                          { value: 'producing', label: 'Producing Field (Material Balance Basis)' },
                          { value: 'mature', label: 'Mature Field (Decline Curve Basis)' },
                        ]}
                      />
                    </div>

                    <div className="input-cell">
                      <label htmlFor="new-project-desc">Description</label>
                      <input
                        id="new-project-desc"
                        type="text"
                        placeholder="Optional geological or aquifer notes"
                        value={descriptionInput}
                        onChange={(e) => setDescriptionInput(e.target.value)}
                        className="standard-input"
                      />
                    </div>
                  </div>

                  <div className="modal-actions-row">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="secondary-action-btn"
                    >
                      <Cancel01Icon size={16} />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreate(false)}
                      className="secondary-action-btn"
                    >
                      <Add01Icon size={16} />
                      <span>Create and Stay Here</span>
                    </button>
                    <button type="submit" className="top-action-btn">
                      <Calculator01Icon size={16} />
                      <span>Create and Open Calculations</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="projects-grid">
        {visibleProjects.map((project) => {
          const isActive = project.id === activeProjectId
          const projRes = projectResultsById[project.id]
          const giip = projRes ? projRes.volRes.giipBscf.toFixed(2) : '0.00'
          const eur = projRes ? projRes.recommendation.finalRecommendedEurBscf.toFixed(2) : '0.00'
          const years = projRes ? projRes.forecastRes.yearsToDeplete.toFixed(1) : '0.0'
          const fluid = projRes ? projRes.classification.fluidType : 'Dry Gas'
          const aquiferLabel = project.inputs.aquiferModel === 'schilthuis' ? 'Schilthuis' : 'Pot'

          return (
            <div
              key={project.id}
              className={`standard-card project-workspace-card ${isActive ? 'active-workspace' : ''}`}
            >
              <div className="project-card-top">
                <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    {project.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {project.description}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {isActive ? 'Active Workspace' : 'Inactive Workspace'}
                </div>
              </div>

              <div className="project-metrics-mini-grid">
                <div className="data-item">
                  <span className="data-label">Fluid Type</span>
                  <span className="data-value" style={{ fontSize: '0.95rem' }}>{fluid}</span>
                </div>
                <div className="data-item">
                  <span className="data-label">GIIP</span>
                  <span className="data-value" style={{ fontSize: '0.95rem' }}>{giip} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Recommended EUR</span>
                  <span className="data-value" style={{ fontSize: '0.95rem' }}>{eur} Bscf</span>
                </div>
                <div className="data-item">
                  <span className="data-label">Depletion Time</span>
                  <span className="data-value" style={{ fontSize: '0.95rem' }}>{years} yrs</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', marginBottom: '1.35rem' }}>
                Aquifer Model: {aquiferLabel}
              </div>

              <div className="project-card-actions">
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => switchProject(project.id)}
                    className="top-action-btn"
                  >
                    <ArrowLeftRightIcon size={16} />
                    <span>Switch Workspace</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    switchProject(project.id)
                    navigate('/calculations')
                  }}
                  className="secondary-action-btn"
                >
                  <Calculator01Icon size={16} />
                  <span>Open Inputs</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchProject(project.id)
                    navigate('/results')
                  }}
                  className="secondary-action-btn"
                >
                  <ChartLineData01Icon size={16} />
                  <span>View Results</span>
                </button>

                {projects.length > 1 && confirmDeleteId !== project.id && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(project.id)}
                    className="secondary-action-btn"
                  >
                    <Delete02Icon size={16} />
                    <span>Remove</span>
                  </button>
                )}

                {projects.length > 1 && confirmDeleteId === project.id && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        deleteProject(project.id)
                        setConfirmDeleteId(null)
                      }}
                      className="secondary-action-btn"
                      style={{ color: '#dc2626' }}
                    >
                      <Tick02Icon size={16} />
                      <span>Confirm Remove</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="secondary-action-btn"
                    >
                      <Cancel01Icon size={16} />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {visibleProjects.length === 0 && (
        <div className="standard-card" style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            No project workspaces match your current search filter.
          </p>
        </div>
      )}
    </motion.div>
  )
}
