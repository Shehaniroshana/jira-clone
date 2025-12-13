import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Toaster } from '@/components/ui/toaster'
import Antigravity from '@/components/ui/Antigravity'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ProjectPage from '@/pages/ProjectPage'
import BoardPage from '@/pages/BoardPage'
import BacklogPage from '@/pages/BacklogPage'
import ReportsPage from '@/pages/ReportsPage'
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

function App() {
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

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
            <Route path="/projects/:projectId/sprints" element={<SprintManagementPage />} />
            <Route path="/projects/:projectId/settings" element={<ProjectSettingsPage />} />
            <Route path="/projects/:projectId/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}


export default App
