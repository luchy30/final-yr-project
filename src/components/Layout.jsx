import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Folder01Icon,
  Calculator01Icon,
  ChartLineData01Icon,
  MathIcon,
  File01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  Sun01Icon,
  Moon01Icon,
} from 'hugeicons-react'
import { useReservoir } from '../context/useReservoir'
import CustomSelect from './CustomSelect'

export function Layout() {
  const {
    theme,
    handleThemeChange,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    projects,
    activeProject,
    switchProject,
  } = useReservoir()

  const location = useLocation()
  const pathname = location.pathname

  const getPageTitle = (path) => {
    if (path.startsWith('/projects')) {
      return 'Projects'
    }
    if (path.startsWith('/calculations') || path.startsWith('/calculation')) {
      return 'Calculations'
    }
    if (path.startsWith('/results')) {
      return 'Results and Analysis'
    }
    if (path.startsWith('/formulas') || path.startsWith('/formula')) {
      return 'Methodology Formulas'
    }
    if (path.startsWith('/reports')) {
      return 'Reports'
    }
    if (path.startsWith('/settings')) {
      return 'Settings'
    }
    return 'PetroReserves'
  }

  return (
    <div className={`dashboard-layout theme-${theme}`} data-theme={theme}>
      {/* Collapsible Left Sidebar */}
      <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          <div className="sidebar-header-row">
            {!isSidebarCollapsed && (
              <h2 className="brand-text">PetroReserves</h2>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="sidebar-toggle-btn"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <SidebarLeft01Icon size={18} />
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="sidebar-workspace-box">
              <label htmlFor="sidebar-workspace-select" className="sidebar-workspace-label">
                ACTIVE FIELD WORKSPACE
              </label>
              <CustomSelect
                id="sidebar-workspace-select"
                variant="sidebar"
                value={activeProject.id}
                onChange={switchProject}
                options={projects.map((proj) => ({
                  value: proj.id,
                  label: proj.name,
                }))}
              />
            </div>
          )}

          <nav className="sidebar-nav">
            <NavLink
              to="/projects"
              className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
              title="Projects"
            >
              <Folder01Icon size={20} />
              {!isSidebarCollapsed && <span className="nav-label-text">Projects</span>}
            </NavLink>

            <NavLink
              to="/calculations"
              className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
              title="Calculations"
            >
              <Calculator01Icon size={20} />
              {!isSidebarCollapsed && <span className="nav-label-text">Calculations</span>}
            </NavLink>

            <NavLink
              to="/results"
              className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
              title="Results and Analysis"
            >
              <ChartLineData01Icon size={20} />
              {!isSidebarCollapsed && <span className="nav-label-text">Results and Analysis</span>}
            </NavLink>

            <NavLink
              to="/formulas"
              className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
              title="Formulas"
            >
              <MathIcon size={20} />
              {!isSidebarCollapsed && <span className="nav-label-text">Formulas</span>}
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
              title="Reports"
            >
              <File01Icon size={20} />
              {!isSidebarCollapsed && <span className="nav-label-text">Reports</span>}
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
              title="Settings"
            >
              <Settings01Icon size={20} />
              {!isSidebarCollapsed && <span className="nav-label-text">Settings</span>}
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="appearance-section">
            {!isSidebarCollapsed && (
              <span className="appearance-section-title">APPEARANCE</span>
            )}
            <div className="appearance-segmented-toggle">
              <button
                type="button"
                className={`appearance-toggle-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
                title="Light mode"
              >
                <Sun01Icon size={16} />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`appearance-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
                title="Dark mode"
              >
                <Moon01Icon size={16} />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-title">
            <h1>{getPageTitle(pathname)}</h1>
            <div className="topbar-project-subtitle">
              Workspace: {activeProject.name}
            </div>
          </div>
        </header>

        {/* Page Content Rendered via Router Outlet */}
        <Outlet />
      </main>
    </div>
  )
}
