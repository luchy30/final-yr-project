import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ReservoirProvider } from './context/ReservoirContext'
import { Layout } from './components/Layout'
import { CalculationsPage } from './pages/CalculationsPage'
import { ResultsAnalysisPage } from './pages/ResultsAnalysisPage'
import { FormulasPage } from './pages/FormulasPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

function App() {
  return (
    <ReservoirProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
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
    </ReservoirProvider>
  )
}

export default App
