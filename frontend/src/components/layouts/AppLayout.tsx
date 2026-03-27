
import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import {
  LogOut, LayoutDashboard,
  ChevronDown,
  List, Zap, Shield, TrendingUp, Settings, Milestone
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { wsService } from '@/services/websocketService'
import NotificationDropdown from '@/components/NotificationDropdown'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SpaceBackground from '@/components/three/SpaceBackground'

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const { projects, currentProject, fetchProjects } = useProjectStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useParams()
  const [showProjectMenu, setShowProjectMenu] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (user) {
      wsService.connect()
    }
    return () => {
      wsService.disconnect()
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Space Background */}
      <SpaceBackground />

      {/* Vertical Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 sidebar-glass z-50 flex flex-col">
        {/* Logo Section */}
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300 overflow-hidden">
                <img src="/icon.png" alt="REX Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-xl font-bold text-gradient tracking-tight">
              REX
            </span>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin">

          {/* Main Menu */}
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Main Menu
            </h3>

            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname === '/'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${location.pathname === '/' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}`} />
              Dashboard
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname === '/admin'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Shield className={`w-4 h-4 ${location.pathname === '/admin' ? 'text-purple-400' : 'text-slate-500 group-hover:text-white'}`} />
                Admin
              </Link>
            )}
          </div>

          {/* Project Section */}
          <div className="space-y-1">
            <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Project
            </h3>

            {/* Project Selector */}
            <div className="relative mb-4">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm font-medium transition-all hover:border-slate-700 ${showProjectMenu ? 'ring-2 ring-cyan-500/20 border-cyan-500/30' : ''
                  }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {currentProject ? currentProject.key.substring(0, 2) : 'P'}
                  </div>
                  <span className="truncate text-slate-200">
                    {currentProject?.name || 'Select Project'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showProjectMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Project Dropdown */}
              {showProjectMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 p-1 glass-card rounded-xl border border-slate-700/50 z-50 animate-scale-in">
                  <div className="max-h-60 overflow-y-auto scrollbar-thin">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          navigate(`/projects/${project.id}/board`)
                          setShowProjectMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group text-left"
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: project.color || '#06b6d4' }}
                        >
                          {project.key.substring(0, 2)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                            {project.name}
                          </p>
                        </div>
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-500">
                        No projects found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Project Links */}
            {projectId ? (
              <div className="space-y-1">
                <Link to={`/projects/${projectId}/board`} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname.includes('/board') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <LayoutDashboard className="w-4 h-4" /> Board
                </Link>
                <Link to={`/projects/${projectId}/backlog`} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname.includes('/backlog') ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <List className="w-4 h-4" /> Backlog
                </Link>
                <Link to={`/projects/${projectId}/sprints`} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname.includes('/sprints') ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <Zap className="w-4 h-4" /> Sprints
                </Link>
                <Link to={`/projects/${projectId}/reports`} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname.includes('/reports') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <TrendingUp className="w-4 h-4" /> Reports
                </Link>
                <Link to={`/projects/${projectId}/roadmap`} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname.includes('/roadmap') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <Milestone className="w-4 h-4" /> Roadmap
                </Link>
                <Link to={`/projects/${projectId}/settings`} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 group ${location.pathname.includes('/settings') ? 'bg-slate-500/20 text-slate-300' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </div>
            ) : (
              <div className="px-4 py-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-500">Select a project to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <LanguageSwitcher />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <Avatar className="w-8 h-8 ring-2 ring-cyan-500/20">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs font-bold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName}
                </p>
                <p className="text-xs text-cyan-400 font-medium truncate capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen relative w-[calc(100%-16rem)] overflow-x-hidden">
        <div className="w-full p-4 md:p-8 animate-fade-in">
          <div className="mb-8 flex items-center justify-between">

          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
