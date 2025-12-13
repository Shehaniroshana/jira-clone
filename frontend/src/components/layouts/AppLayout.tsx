import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useProjectStore } from '@/store/projectStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import {
  LogOut, LayoutDashboard, FolderKanban,
  Search, ChevronDown,
  List, Zap, Shield, TrendingUp, Settings
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { wsService } from '@/services/websocketService'
import NotificationDropdown from '@/components/NotificationDropdown'
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

  const isProjectRoute = location.pathname.includes('/projects/')

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Space Background */}
      <SpaceBackground />

      {/* Header */}
      <div className="fixed top-4 left-0 right-0 z-50 px-4">
        <header className="container mx-auto glass-card rounded-2xl transition-all duration-300 hover:border-cyan-500/20">
          <div className="px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center gap-8">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gradient tracking-tight">
                    JiraFlow
                  </span>
                </Link>

                {/* Main Nav */}
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    to="/"
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname === '/'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 neon-cyan font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden 2xl:inline">Dashboard</span>
                  </Link>

                  {/* Admin Link */}
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname === '/admin'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 neon-purple font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden 2xl:inline">Admin</span>
                    </Link>
                  )}

                  {/* Project Dropdown */}
                  {projects.length > 0 && (
                    <div className="relative group/proj">
                      <button
                        onClick={() => setShowProjectMenu(!showProjectMenu)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 whitespace-nowrap ${isProjectRoute
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <FolderKanban className="w-4 h-4 shrink-0" />
                        <span className="truncate max-w-[150px]">{currentProject?.name || 'Projects'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showProjectMenu ? 'rotate-180' : ''}`} />
                      </button>

                      {showProjectMenu && (
                        <div className="absolute top-full text-left left-0 mt-2 w-72 glass-card rounded-2xl py-3 animate-scale-in z-50 origin-top-left border border-cyan-500/10">
                          <div className="px-4 py-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">
                            Your Projects
                          </div>
                          {projects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => {
                                navigate(`/projects/${project.id}/board`)
                                setShowProjectMenu(false)
                              }}
                              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors group"
                            >
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                                style={{
                                  backgroundColor: project.color || '#06b6d4',
                                  boxShadow: `0 0 20px ${project.color || '#06b6d4'}40`
                                }}
                              >
                                {project.key.substring(0, 2)}
                              </div>
                              <div className="text-left flex-1">
                                <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                                  {project.name}
                                </p>
                                <p className="text-xs text-slate-500 font-mono">{project.key}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Project Links */}
                  {projectId && (
                    <>
                      <div className="h-4 w-px bg-slate-700/50 mx-2" />
                      <Link
                        to={`/projects/${projectId}/board`}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname.includes('/board')
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="hidden 2xl:inline">Board</span>
                      </Link>
                      <Link
                        to={`/projects/${projectId}/backlog`}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname.includes('/backlog')
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <List className="w-4 h-4" />
                        <span className="hidden 2xl:inline">Backlog</span>
                      </Link>
                      <Link
                        to={`/projects/${projectId}/reports`}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname.includes('/reports')
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span className="hidden 2xl:inline">Reports</span>
                      </Link>
                      <Link
                        to={`/projects/${projectId}/sprints`}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname.includes('/sprints')
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span className="hidden 2xl:inline">Sprints</span>
                      </Link>
                      <Link
                        to={`/projects/${projectId}/settings`}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname.includes('/settings')
                          ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30 font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden 2xl:inline">Settings</span>
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden lg:block group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-48 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/20 transition-all focus:bg-slate-800/80"
                  />
                </div>

                {/* Notifications */}
                <NotificationDropdown />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                {/* User Menu */}
                {user && (
                  <div className="flex items-center gap-2 pl-3 border-l border-slate-700/50 ml-1">
                    <div className="hidden lg:flex flex-col items-end mr-3">
                      <p className="text-sm font-bold text-slate-200 leading-none">
                        {user.firstName}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold mt-1">
                        {user.role}
                      </p>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                      <Avatar className="relative w-10 h-10 ring-2 ring-cyan-500/30 cursor-pointer transition-transform hover:scale-110">
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-bold">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* Click outside to close project menu */}
      {showProjectMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProjectMenu(false)}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-28 pb-8">
        <Outlet />
      </main>
    </div>
  )
}
