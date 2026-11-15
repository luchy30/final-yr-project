import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { ReservoirProvider } from './context/ReservoirContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { CalculationsPage } from './pages/CalculationsPage'
import { ResultsAnalysisPage } from './pages/ResultsAnalysisPage'
import { FormulasPage } from './pages/FormulasPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

function AuthLoadingScreen() {
  const { theme } = useAuth()
  return (
    <div className={`auth-page theme-${theme}`} data-theme={theme}>
      <div className="auth-loading-state">Loading student workspace...</div>
    </div>
  )
}

function PublicLoginRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return <AuthLoadingScreen />
  }
  if (user) {
    return <Navigate to="/calculations" replace />
  }
  return <LoginPage />
}

function ProtectedWorkspaceShell() {
  const { user, loading } = useAuth()
  if (loading) {
    return <AuthLoadingScreen />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return (
    <ReservoirProvider user={user} key={user.id}>
      <Layout />
    </ReservoirProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicLoginRoute />} />
          <Route path="/" element={<ProtectedWorkspaceShell />}>
            <Route index element={<Navigate to="/calculations" replace />} />
            <Route path="calculations" element={<CalculationsPage />} />
            <Route path="calculation" element={<CalculationsPage />} />
            <Route path="reservoir-data" element={<Navigate to="/calculations" replace />} />
            <Route path="results" element={<ResultsAnalysisPage />} />
            <Route path="results-analysis" element={<ResultsAnalysisPage />} />
            <Route path="dashboard" element={<Navigate to="/results" replace />} />
            <Route path="formulas" element={<FormulasPage />} />
            <Route path="formula" element={<FormulasPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/calculations" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
