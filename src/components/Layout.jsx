import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, LayoutGroup } from 'framer-motion'
import {
  Folder01Icon,
  Calculator01Icon,
  ChartLineData01Icon,
  MathIcon,
  File01Icon,
  Settings01Icon,
  SidebarLeft01Icon,
  Menu01Icon,
  Cancel01Icon,
  Sun01Icon,
  Moon01Icon,
} from 'hugeicons-react'
import { useReservoir } from '../context/useReservoir'
import CustomSelect from './CustomSelect'

const NAV_ITEMS = [
  { to: '/projects', label: 'Projects', icon: Folder01Icon },
  { to: '/calculations', label: 'Calculations', icon: Calculator01Icon },
  { to: '/results', label: 'Results and Analysis', icon: ChartLineData01Icon },
  { to: '/formulas', label: 'Formulas', icon: MathIcon },
  { to: '/reports', label: 'Reports', icon: File01Icon },
  { to: '/settings', label: 'Settings', icon: Settings01Icon },
]

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const sidebarRef = useRef(null)

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined

    const handlePointerDown = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

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
      {/* Collapsible Navigation Sidebar / Mobile Header Drawer */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}
      >
        <div className="sidebar-header-row">
          <div className="sidebar-brand-group">
            <img
              src="/logo-white.svg"
              alt="PetroReserves logo"
              className="sidebar-brand-logo"
              width={26}
              height={26}
            />
            <h2 className="brand-text">PetroReserves</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="sidebar-toggle-btn desktop-sidebar-toggle"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <SidebarLeft01Icon size={18} />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="sidebar-toggle-btn mobile-menu-toggle"
            title={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <Cancel01Icon size={20} /> : <Menu01Icon size={20} />}
          </button>
        </div>

        <div className="sidebar-menu-body">
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

          <LayoutGroup id="sidebar-nav">
            <nav className="sidebar-nav">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) => (isActive ? 'nav-button active' : 'nav-button')}
                    title={item.label}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layout="position"
                            layoutId="sidebar-active-nav"
                            className="nav-active-pill"
                            aria-hidden="true"
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 34,
                              mass: 0.8,
                            }}
                          />
                        )}
                        <span className="nav-button-content">
                          <Icon size={20} />
                          <span className="nav-label-text">{item.label}</span>
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </LayoutGroup>

          <div className="sidebar-footer">
            <div className="appearance-section">
              <span className="appearance-section-title">APPEARANCE</span>
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
