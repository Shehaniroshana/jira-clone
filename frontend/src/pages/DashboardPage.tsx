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
  Target, Sparkles, Calendar
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { CreateProjectInput, Issue } from '@/types'
import { useToast } from '@/hooks/use-toast'
import StatsGrid from '@/components/dashboard/StatsGrid'
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts'
import RecentActivity from '@/components/dashboard/RecentActivity'
import QuickActions from '@/components/dashboard/QuickActions'
import { subDays, format, isSameDay, parseISO } from 'date-fns'

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
  const { stats, allIssues, weeklyData } = useMemo(() => {
    const flattened = Object.values(issues).flat() as Issue[]
    const myIssues = flattened.filter(i => i.assigneeId === user?.id)

    // Calculate weekly data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i)
      return d
    })

    const weeklyStats = last7Days.map(day => {
      const addedCount = flattened.filter(issue =>
        isSameDay(parseISO(issue.createdAt), day)
      ).length

      const completedCount = flattened.filter(issue =>
        issue.status === 'done' && isSameDay(parseISO(issue.updatedAt), day)
      ).length

      return {
        name: format(day, 'EEE'), // Mon, Tue, etc.
        completed: completedCount,
        added: addedCount
      }
    })

    return {
      allIssues: flattened,
      weeklyData: weeklyStats,
      stats: {
        totalProjects: projects.length,
        totalIssues: flattened.length,
        myTasks: myIssues.length,
        completedToday: flattened.filter(i => {
          return i.status === 'done' && isSameDay(parseISO(i.updatedAt), new Date())
        }).length,
        inProgress: flattened.filter(i => i.status === 'in_progress').length,
        todo: flattened.filter(i => i.status === 'todo').length,
        done: flattened.filter(i => i.status === 'done').length,
        bugs: flattened.filter(i => i.type === 'bug').length,
      }
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
    <>
      <div className="space-y-6 animate-fade-in p-2 pb-20 max-w-[1600px] mx-auto">
      {/* Hero Section - made slightly more compact */}
      <div className="relative overflow-hidden rounded-[2rem] glass-card p-8 text-white group shadow-2xl shadow-black/20">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 gradient-mesh opacity-80" />
        <div className="absolute inset-0 grid-pattern opacity-30" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 w-full md:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full text-xs text-slate-300 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              <Calendar className="w-3 h-3 mr-1 text-cyan-400" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>

            <div>
              <p className="text-slate-300 text-lg mb-1 font-medium tracking-wide">{getGreeting()},</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter drop-shadow-2xl flex flex-wrap gap-x-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-white animate-gradient-x">{user?.firstName}</span>
                <span className="text-slate-400 font-bold">{user?.lastName}</span>
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full">
              <div className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur flex items-center gap-2">
                <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Assigned</p>
                  <p className="text-lg font-bold text-white leading-none">{stats.myTasks}</p>
                </div>
              </div>
              <div className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-500/20 text-purple-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">In Progress</p>
                  <p className="text-lg font-bold text-white leading-none">{stats.inProgress}</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-neon h-14 px-8 text-base font-bold shadow-2xl shadow-cyan-500/30 border border-white/20 w-full md:w-auto mt-4 md:mt-0"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
            New Project
          </Button>
        </div>
      </div>

      {/* New Creative Stats Grid with Sparklines */}
      <StatsGrid stats={stats} />

      {/* Analytics & Charts */}
      <AnalyticsCharts stats={stats} weeklyData={weeklyData} />

      {/* Bento Grid Layout for Activity & Actions - Made Compact */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* Recent Activity - Takes up 8 columns (2/3) */}
        <div className="xl:col-span-8 w-full">
          <RecentActivity issues={allIssues} />
        </div>

        {/* Quick Actions - Takes up 4 columns (1/3) */}
        <div className="xl:col-span-4 w-full h-full">
          <QuickActions projects={projects} onCreateProject={() => setShowCreateModal(true)} />
        </div>
      </div>

      {/* Projects Section - Compact Card Design */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
              <FolderKanban className="w-6 h-6 text-cyan-400" />
            </div>
            Your Workspace
          </h2>
          <Button onClick={() => setShowCreateModal(true)} className="btn-glass px-4 h-10 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shimmer h-48 rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card rounded-2xl border-2 border-dashed border-slate-700/50 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 animate-float">
                <FolderKanban className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No projects yet
              </h3>
              <p className="text-slate-400 mb-6 text-center max-w-sm text-sm">
                Get started by creating your first project to organize your tasks
                and collaborate with your team.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="btn-neon px-6 py-2 text-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, index) => {
              const projectIssues = issues[project.id] || []
              const progress = projectIssues.length > 0
                ? Math.round((projectIssues.filter((i: Issue) => i.status === 'done').length / projectIssues.length) * 100)
                : 0

              return (
                <div
                  key={project.id}
                  className="glass-card-hover rounded-2xl cursor-pointer group overflow-hidden animate-slide-up relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/projects/${project.id}/board`)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Colored glow bar */}
                  <div
                    className="h-1 transition-all duration-300 group-hover:h-2 w-full"
                    style={{
                      backgroundColor: project.color || '#06b6d4',
                      boxShadow: `0 0 20px ${project.color || '#06b6d4'}80`
                    }}
                  />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className="font-mono text-[10px] px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${project.color}15` || '#06b6d415',
                              color: project.color || '#06b6d4',
                              borderColor: `${project.color}30` || '#06b6d430'
                            }}
                          >
                            {project.key}
                          </Badge>
                          <span className="text-xs text-slate-500 font-medium">{formatDate(project.updatedAt)}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mb-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed h-10">
                          {project.description || 'No description provided'}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                        <span className="uppercase tracking-wider font-bold">Progress</span>
                        <span className="font-bold text-white text-xs">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: project.color || '#06b6d4',
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                      <span className="flex items-center gap-1.5 group-hover:text-white transition-colors">
                        <Target className="w-3.5 h-3.5" />
                        <span className="font-medium">{projectIssues.length}</span> issues
                      </span>
                      <span className="flex items-center gap-1.5 group-hover:text-white transition-colors">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-medium">{project.members?.length || 1}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-card bg-blue-950/30 border border-white/10 w-full max-w-lg rounded-3xl animate-scale-in shadow-2xl shadow-primary/10">
            <div className="p-8">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-primary/10">
                  <FolderKanban className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Create New Project</h2>
                  <p className="text-slate-400">Start organizing your work today</p>
                </div>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Project Key <span className="text-red-400">*</span></label>
                  <Input
                    placeholder="e.g., PROJ"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    maxLength={10}
                    required
                    className="font-mono uppercase bg-slate-900/50 border-slate-700 text-white focus:border-primary h-12 text-lg tracking-wider"
                  />
                  <p className="text-xs text-slate-500 ml-1">
                    Unique identifier used in issue keys (max 10 chars)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Project Name <span className="text-red-400">*</span></label>
                  <Input
                    placeholder="My Awesome Project"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-primary h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 ml-1">Description</label>
                  <Input
                    placeholder="What is this project about?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-primary h-12"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-300 ml-1">Theme Color</label>
                  <div className="flex gap-3 flex-wrap p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
                    {['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-full transition-all duration-300 ${formData.color === color
                          ? 'ring-4 ring-offset-4 ring-offset-slate-900 ring-white scale-110'
                          : 'hover:scale-110 hover:shadow-lg'
                          }`}
                        style={{
                          backgroundColor: color,
                          boxShadow: formData.color === color ? `0 0 20px ${color}` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-12"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="neon" className="flex-1 h-12 text-base shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
          </div>
      )}
    </>
  )
}
