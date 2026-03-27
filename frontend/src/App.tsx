import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'
import Antigravity from '@/components/ui/Antigravity'
import { setupService } from '@/services/setupService'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DatabaseSetupPage from '@/pages/setup/DatabaseSetupPage'
import DashboardPage from '@/pages/DashboardPage'
import ProjectPage from '@/pages/ProjectPage'
import BoardPage from '@/pages/BoardPage'
import BacklogPage from '@/pages/BacklogPage'
import ReportsPage from '@/pages/ReportsPage'
import RoadmapPage from '@/pages/RoadmapPage'
import IssueDetailPage from '@/pages/IssueDetailPage'
import AdminPage from '@/pages/AdminPage'
import SprintManagementPage from '@/pages/SprintManagementPage'
import ProjectSettingsPage from '@/pages/ProjectSettingsPage'

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout'
import AppLayout from '@/components/layouts/AppLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, fetchUser } = useAuthStore()

  useEffect(() => {
    if (token && !user) {
      fetchUser()
    }
  }, [token, user, fetchUser])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function CallClone() {
  const [isSetupConfigured, setIsSetupConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchSetupStatus = async () => {
      try {
        const status = await setupService.getStatus()
        setIsSetupConfigured(status.configured)
      } catch {
        // Fallback to true if API is unreachable (it might be trying to connect before port is ready)
        // The real catch will happen inside the API layer if it fails.
        setIsSetupConfigured(false)
      }
    }

    fetchSetupStatus()
  }, [])

  if (isSetupConfigured === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-300">Loading setup...</p>
      </div>
    )
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* Antigravity particle background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <Antigravity
          count={300}
          color={'#06b6d4'}
          particleSize={3}
          speed={0.5}
          opacity={0.6}
        />
      </div>

      {/* Main app content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={isSetupConfigured ? <LoginPage /> : <Navigate to="/setup" replace />}
            />
            <Route
              path="/register"
              element={isSetupConfigured ? <RegisterPage /> : <Navigate to="/setup" replace />}
            />
          </Route>

          <Route
            path="/setup"
            element={
              isSetupConfigured ? (
                <Navigate to="/login" replace />
              ) : (
                <DatabaseSetupPage onConfigured={() => setIsSetupConfigured(true)} />
              )
            }
          />

          {/* App Routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects/:projectId" element={<ProjectPage />} />
            <Route path="/projects/:projectId/board" element={<BoardPage />} />
            <Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
            <Route path="/projects/:projectId/reports" element={<ReportsPage />} />
            <Route path="/projects/:projectId/roadmap" element={<RoadmapPage />} />
            <Route path="/projects/:projectId/sprints" element={<SprintManagementPage />} />
            <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
            <Route path="/projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to={isSetupConfigured ? '/' : '/setup'} replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}


export default CallClone
