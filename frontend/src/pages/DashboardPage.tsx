import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'
import { useIssueStore } from '@/store/issueStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus, FolderKanban, Clock, Users,
  CheckCircle2, AlertCircle, ArrowUpRight,
  LayoutDashboard, Zap, Target, BarChart3, Sparkles
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { CreateProjectInput, Issue } from '@/types'
import { useToast } from '@/hooks/use-toast'

export default function DashboardPage() {
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore()
  const { issues, fetchIssues } = useIssueStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState<CreateProjectInput>({
    key: '',
    name: '',
    description: '',
    color: '#06b6d4',
    ownerId: '',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  // Load issues for all projects to show stats
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(p => fetchIssues(p.id))
    }
  }, [projects])

  // Calculate statistics
  const stats = useMemo(() => {
    const allIssues = Object.values(issues).flat() as Issue[]
    const myIssues = allIssues.filter(i => i.assigneeId === user?.id)

    return {
      totalProjects: projects.length,
      totalIssues: allIssues.length,
      myTasks: myIssues.length,
      completedToday: allIssues.filter(i => {
        const today = new Date().toDateString()
        return i.status === 'done' && new Date(i.updatedAt).toDateString() === today
      }).length,
      inProgress: allIssues.filter(i => i.status === 'in_progress').length,
      todo: allIssues.filter(i => i.status === 'todo').length,
      done: allIssues.filter(i => i.status === 'done').length,
      bugs: allIssues.filter(i => i.type === 'bug').length,
    }
  }, [issues, projects, user])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const project = await createProject(formData)
      toast({
        title: "Success",
        description: "Project created successfully!",
      })
      setShowCreateModal(false)
      setFormData({ key: '', name: '', description: '', color: '#06b6d4', ownerId: '' })
      navigate(`/projects/${project.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create project",
      })
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 text-white group">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 gradient-mesh opacity-80" />

        {/* Floating orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl -ml-40 -mb-40 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '5s' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass-panel rounded-full text-sm text-slate-300">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>

            <div>
              <p className="text-slate-400 text-lg mb-1">{getGreeting()},</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                <span className="text-gradient-animate">{user?.firstName}</span>
                <span className="text-white ml-2">{user?.lastName}</span>
              </h1>
            </div>

            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
              You have <span className="font-bold text-white px-3 py-1 glass-panel rounded-lg">{stats.myTasks} tasks</span> assigned to you
              and <span className="font-bold text-cyan-400 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">{stats.inProgress} in progress</span>.
            </p>

            {/* Quick stats pills */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-sm backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-medium">{stats.done} completed</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-sm backdrop-blur-sm">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 font-medium">{stats.bugs} bugs</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-neon h-14 px-8 text-base font-semibold"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Projects */}
        <div className="glass-card-hover rounded-2xl p-6 group animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
              <FolderKanban className="w-6 h-6" />
            </div>
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:bg-cyan-500/20 transition-colors">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
          <p className="text-4xl font-black text-white tracking-tight neon-text-cyan">{stats.totalProjects}</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">Total Projects</p>
        </div>

        {/* Issues */}
        <div className="glass-card-hover rounded-2xl p-6 group animate-slide-up delay-75">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              <Target className="w-6 h-6" />
            </div>
            <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 group-hover:bg-purple-500/20 transition-colors">
              {stats.myTasks} assigned
            </Badge>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">{stats.totalIssues}</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">Total Issues</p>
        </div>

        {/* In Progress */}
        <div className="glass-card-hover rounded-2xl p-6 group animate-slide-up delay-150">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              <Zap className="w-6 h-6" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/20 transition-colors">
              In Progress
            </Badge>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">{stats.inProgress}</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">Active Tasks</p>
        </div>

        {/* Completed */}
        <div className="glass-card-hover rounded-2xl p-6 group animate-slide-up delay-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/20 transition-colors">
              +{stats.completedToday} today
            </Badge>
          </div>
          <p className="text-4xl font-black text-white tracking-tight">{stats.done}</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">Completed</p>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Task Distribution</h3>
              <p className="text-sm text-slate-400">Overview of all tasks by status</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* To Do */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2 text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  To Do
                </span>
                <span className="text-slate-400">{stats.todo} issues</span>
              </div>
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stats.totalIssues ? (stats.todo / stats.totalIssues) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* In Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2 text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                  In Progress
                </span>
                <span className="text-slate-400">{stats.inProgress} issues</span>
              </div>
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${stats.totalIssues ? (stats.inProgress / stats.totalIssues) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Done */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2 text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  Done
                </span>
                <span className="text-slate-400">{stats.done} issues</span>
              </div>
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${stats.totalIssues ? (stats.done / stats.totalIssues) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Bugs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2 text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                  Bugs
                </span>
                <span className="text-slate-400">{stats.bugs} issues</span>
              </div>
              <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  style={{ width: `${stats.totalIssues ? (stats.bugs / stats.totalIssues) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Quick Actions</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-cyan-500/10 hover:border-cyan-500/30 group transition-all"
            >
              <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                <Plus className="w-5 h-5 text-cyan-400 group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">New Project</p>
                <p className="text-xs text-slate-400">Create a new workspace</p>
              </div>
            </button>

            {projects[0] && (
              <button
                onClick={() => navigate(`/projects/${projects[0].id}/board`)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-purple-500/10 hover:border-purple-500/30 group transition-all"
              >
                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <LayoutDashboard className="w-5 h-5 text-purple-400 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Kanban Board</p>
                  <p className="text-xs text-slate-400">View active tasks</p>
                </div>
              </button>
            )}

            <button
              onClick={() => projects[0] && navigate(`/projects/${projects[0].id}/backlog`)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 group transition-all"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Target className="w-5 h-5 text-emerald-400 group-hover:text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">View Backlog</p>
                <p className="text-xs text-slate-400">Plan upcoming work</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-cyan-500/10">
              <FolderKanban className="w-6 h-6 text-cyan-400" />
            </div>
            Your Projects
          </h2>
          <Button onClick={() => setShowCreateModal(true)} className="btn-glass">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shimmer h-48 rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card rounded-2xl border-2 border-dashed border-slate-700">
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
                <FolderKanban className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No projects yet
              </h3>
              <p className="text-slate-400 mb-6 text-center max-w-md">
                Get started by creating your first project to organize your tasks
                and collaborate with your team.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="btn-neon">
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const projectIssues = issues[project.id] || []
              const progress = projectIssues.length > 0
                ? Math.round((projectIssues.filter((i: Issue) => i.status === 'done').length / projectIssues.length) * 100)
                : 0

              return (
                <div
                  key={project.id}
                  className="glass-card-hover rounded-2xl cursor-pointer group overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/projects/${project.id}/board`)}
                >
                  {/* Colored glow bar */}
                  <div
                    className="h-1 transition-all duration-300 group-hover:h-2"
                    style={{
                      backgroundColor: project.color || '#06b6d4',
                      boxShadow: `0 0 20px ${project.color || '#06b6d4'}60`
                    }}
                  />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge
                          className="mb-2 font-mono text-xs"
                          style={{
                            backgroundColor: `${project.color}15` || '#06b6d415',
                            color: project.color || '#06b6d4',
                            borderColor: `${project.color}30` || '#06b6d430'
                          }}
                        >
                          {project.key}
                        </Badge>
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {project.description || 'No description provided'}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Progress</span>
                        <span className="font-medium text-white">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: project.color || '#06b6d4',
                            boxShadow: `0 0 10px ${project.color || '#06b6d4'}80`
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Target className="w-4 h-4" />
                          {projectIssues.length} issues
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          {project.members?.length || 1}
                        </span>
                      </div>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-2xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create New Project</h2>
                  <p className="text-sm text-slate-400">Start organizing your work</p>
                </div>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Project Key *</label>
                  <Input
                    placeholder="e.g., PROJ"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    maxLength={10}
                    required
                    className="font-mono uppercase bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-500">
                    Unique identifier used in issue keys
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Project Name *</label>
                  <Input
                    placeholder="My Awesome Project"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <Input
                    placeholder="What is this project about?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Color</label>
                  <div className="flex gap-2">
                    {['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full transition-all ${formData.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                            : 'hover:scale-110'
                          }`}
                        style={{
                          backgroundColor: color,
                          boxShadow: formData.color === color ? `0 0 20px ${color}80` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 btn-neon" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Project'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 btn-glass"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
