import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useReservoir } from '../context/useReservoir'
import { PROJECT_TEMPLATES } from '../utils/reservoirEngine'

export function ProjectsPage() {
  const navigate = useNavigate()
  const {
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
          onClick={() => setIsCreating((prev) => !prev)}
          className="top-action-btn"
        >
          {isCreating ? 'Close Form' : 'Create Project'}
        </button>
      </div>

      {isCreating && (
        <div className="standard-card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
            New Field Workspace
          </h3>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Set up a separate reservoir project with its own petrophysics, fluid properties, decline forecast, and report.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreate(true)
            }}
          >
            <div className="form-columns-grid">
              <div className="input-cell">
                <label htmlFor="new-project-name">Field or Project Name</label>
                <input
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
                <select
                  id="new-project-template"
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="standard-select"
                >
                  {Object.entries(PROJECT_TEMPLATES).map(([key, tpl]) => (
                    <option key={key} value={key}>
                      {tpl.label}
                    </option>
                  ))}
                  <option value="clone">Copy Active Workspace Inputs</option>
                </select>
              </div>

              <div className="input-cell">
                <label htmlFor="new-project-stage">Field Development Stage</label>
                <select
                  id="new-project-stage"
                  value={stageInput}
                  onChange={(e) => setStageInput(e.target.value)}
                  className="standard-select"
                >
                  <option value="early">Early Appraisal (Volumetric Basis)</option>
                  <option value="producing">Producing Field (Material Balance Basis)</option>
                  <option value="mature">Mature Field (Decline Curve Basis)</option>
                </select>
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

            <div className="project-form-actions">
              <button type="submit" className="top-action-btn">
                Create and Open Calculations
              </button>
              <button
                type="button"
                onClick={() => handleCreate(false)}
                className="secondary-action-btn"
              >
                Create and Stay Here
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="secondary-action-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
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
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    {project.name}
                  </h3>
                  <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {project.description}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    marginBottom: '1.25rem',
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

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: '1.25rem' }}>
                Aquifer Model: {aquiferLabel}
              </div>

              <div className="project-card-actions">
                {!isActive && (
                  <button
                    type="button"
                    onClick={() => switchProject(project.id)}
                    className="top-action-btn"
                  >
                    Switch Workspace
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
                  Open Inputs
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchProject(project.id)
                    navigate('/results')
                  }}
                  className="secondary-action-btn"
                >
                  View Results
                </button>

                {projects.length > 1 && confirmDeleteId !== project.id && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(project.id)}
                    className="secondary-action-btn"
                  >
                    Remove
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
                      Confirm Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="secondary-action-btn"
                    >
                      Cancel
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
