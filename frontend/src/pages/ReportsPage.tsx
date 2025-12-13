
import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { ArrowLeft, TrendingUp, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'

const CHART_COLORS = {
  primary: '#06b6d4',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#64748b',
  in_progress: '#3b82f6',
  in_review: '#8b5cf6',
  done: '#10b981',
}

const PRIORITY_COLORS: Record<string, string> = {
  highest: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#06b6d4',
  lowest: '#94a3b8',
}

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      Promise.all([
        fetchProject(projectId),
        fetchIssues(projectId)
      ]).finally(() => setIsLoading(false))
    }
  }, [projectId, fetchProject, fetchIssues])

  const projectIssues = (issues[projectId || ''] || []) as any[]

  // Calculate statistics
  const stats = useMemo(() => {
    const total = projectIssues.length
    const done = projectIssues.filter(i => i.status === 'done').length
    const inProgress = projectIssues.filter(i => i.status === 'in_progress').length
    const inReview = projectIssues.filter(i => i.status === 'in_review').length
    const todo = projectIssues.filter(i => i.status === 'todo').length

    const totalStoryPoints = projectIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0)
    const completedStoryPoints = projectIssues
      .filter(i => i.status === 'done')
      .reduce((sum, i) => sum + (i.storyPoints || 0), 0)

    const bugCount = projectIssues.filter(i => i.type === 'bug').length
    const highPriorityCount = projectIssues.filter(i => 
      i.priority === 'highest' || i.priority === 'high'
    ).length

    return {
      total,
      done,
      inProgress,
      inReview,
      todo,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      totalStoryPoints,
      completedStoryPoints,
      bugCount,
      highPriorityCount,
    }
  }, [projectIssues])

  // Prepare chart data
  const statusData = useMemo(() => [
    { name: 'To Do', value: stats.todo, fill: STATUS_COLORS.todo },
    { name: 'In Progress', value: stats.inProgress, fill: STATUS_COLORS.in_progress },
    { name: 'In Review', value: stats.inReview, fill: STATUS_COLORS.in_review },
    { name: 'Done', value: stats.done, fill: STATUS_COLORS.done },
  ], [stats])

  const priorityData = useMemo(() => [
    { name: 'Highest', value: projectIssues.filter(i => i.priority === 'highest').length },
    { name: 'High', value: projectIssues.filter(i => i.priority === 'high').length },
    { name: 'Medium', value: projectIssues.filter(i => i.priority === 'medium').length },
    { name: 'Low', value: projectIssues.filter(i => i.priority === 'low').length },
    { name: 'Lowest', value: projectIssues.filter(i => i.priority === 'lowest').length },
  ], [projectIssues])

  const typeData = useMemo(() => {
    const types = ['story', 'task', 'bug', 'epic']
    return types.map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: projectIssues.filter(i => i.type === type).length,
    }))
  }, [projectIssues])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
        </div>
        <div className="text-slate-400">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Reports</h1>
            <p className="text-sm text-slate-400 mt-1">{currentProject?.name}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Total Issues</p>
            <Badge variant="secondary">{stats.total}</Badge>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Completed</p>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.done}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.completionRate}% complete</p>
        </div>

        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">In Progress</p>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
        </div>

        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">High Priority</p>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.highPriorityCount}</p>
        </div>
      </div>

      {/* Story Points Summary */}
      {stats.totalStoryPoints > 0 && (
        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Story Points Progress
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {stats.completedStoryPoints} / {stats.totalStoryPoints} completed
              </p>
              <Badge variant="secondary">
                {Math.round((stats.completedStoryPoints / stats.totalStoryPoints) * 100)}%
              </Badge>
            </div>
            <Progress 
              value={(stats.completedStoryPoints / stats.totalStoryPoints) * 100}
              className="h-3"
            />
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Issues by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Issues by Priority</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
              <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Types */}
        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Issues by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
              <Bar dataKey="value" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Timeline */}
        <div className="glass-card p-6 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Issue Summary</h2>
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.fill }}
                    />
                    <span className="text-sm text-slate-300">{status.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{status.value}</span>
                </div>
                <Progress value={(status.value / stats.total) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
