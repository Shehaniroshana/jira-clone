import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'
import { 
  Plus, Calendar, Play, CheckCircle,
  Target, Users, TrendingUp, BarChart2,
  Edit2, CalendarDays, Activity, Flame, Zap
} from 'lucide-react'
import { format, differenceInDays, addDays, parseISO } from 'date-fns'
import { getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import IssueDetailModal from '@/components/IssueDetailModal'
import type { Issue, Sprint } from '@/types'

// Theme Colors
const CHART_COLORS = {
  primary: '#06b6d4',   // Cyan
  secondary: '#3b82f6', // Blue
  success: '#10b981',   // Emerald
  warning: '#f59e0b',   // Amber
  danger: '#ef4444',    // Red
  info: '#6366f1',      // Indigo
  gradient: ['#06b6d4', '#3b82f6', '#6366f1'],
  bg: '#1e293b'         // Slate 800
}

const STATUS_COLORS: Record<string, string> = {
  'todo': '#64748b',
  'in_progress': '#3b82f6',
  'in_review': '#8b5cf6',
  'done': '#10b981',
}

export default function SprintManagementPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues, updateIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints, createSprint, startSprint, completeSprint, updateSprint, isLoading } = useSprintStore()
  const { toast } = useToast()
  
  // State
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [incompleteIssueAction, setIncompleteIssueAction] = useState<'backlog' | 'next'>('backlog')
  const [activeTab, setActiveTab] = useState<'overview' | 'burndown' | 'velocity' | 'capacity'>('overview')
  
  // Create sprint form
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
      fetchIssues(projectId)
      fetchSprints(projectId)
    }
  }, [projectId])

  useEffect(() => {
    if (sprints.length > 0 && !selectedSprint) {
      const active = sprints.find((s: Sprint) => s.status === 'active')
      setSelectedSprint(active || sprints[0])
    }
  }, [sprints])

  const projectIssues = issues[projectId || ''] || []
  
  const sprintMetrics = useMemo(() => {
    if (!selectedSprint) return null
    
    const sprintIssues = projectIssues.filter((i: Issue) => i.sprintId === selectedSprint.id)
    const totalPoints = sprintIssues.reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
    const completedPoints = sprintIssues
      .filter((i: Issue) => i.status === 'done')
      .reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
    
    const byStatus = {
      todo: sprintIssues.filter((i: Issue) => i.status === 'todo').length,
      in_progress: sprintIssues.filter((i: Issue) => i.status === 'in_progress').length,
      in_review: sprintIssues.filter((i: Issue) => i.status === 'in_review').length,
      done: sprintIssues.filter((i: Issue) => i.status === 'done').length,
    }
    
    let daysRemaining = 0
    let totalDays = 0
    let daysElapsed = 0
    
    if (selectedSprint.startDate && selectedSprint.endDate) {
      const start = parseISO(selectedSprint.startDate)
      const end = parseISO(selectedSprint.endDate)
      const now = new Date()
      
      totalDays = differenceInDays(end, start)
      daysElapsed = Math.max(0, differenceInDays(now, start))
      daysRemaining = Math.max(0, differenceInDays(end, now))
    }
    
    return {
      totalIssues: sprintIssues.length,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      completionPercentage: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      byStatus,
      daysRemaining,
      totalDays,
      daysElapsed,
      issues: sprintIssues,
    }
  }, [selectedSprint, projectIssues])

  const burndownData = useMemo(() => {
    if (!selectedSprint || !sprintMetrics) return []
    
    const { totalPoints, totalDays } = sprintMetrics
    if (!selectedSprint.startDate || totalDays === 0) return []
    
    const startDate = parseISO(selectedSprint.startDate)
    const data = []
    
    const pointsPerDay = totalPoints / totalDays
    
    for (let i = 0; i <= totalDays; i++) {
      const date = addDays(startDate, i)
      const idealRemaining = Math.max(0, totalPoints - (pointsPerDay * i))
      
      const actualRemaining = i <= sprintMetrics.daysElapsed 
        ? Math.max(0, totalPoints - (sprintMetrics.completedPoints * (i / sprintMetrics.daysElapsed || 1)))
        : null
      
      data.push({
        day: i,
        date: format(date, 'MMM dd'),
        ideal: Math.round(idealRemaining * 10) / 10,
        actual: actualRemaining !== null ? Math.round(actualRemaining * 10) / 10 : undefined,
      })
    }
    
    return data
  }, [selectedSprint, sprintMetrics])

  const velocityData = useMemo(() => {
    const completedSprints = sprints.filter((s: Sprint) => s.status === 'completed')
    
    return completedSprints.slice(-6).map((sprint: Sprint) => {
      const sprintIssues = projectIssues.filter((i: Issue) => i.sprintId === sprint.id)
      const completedPoints = sprintIssues
        .filter((i: Issue) => i.status === 'done')
        .reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
      const totalPoints = sprintIssues.reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
      
      return {
        name: sprint.name,
        completed: completedPoints,
        committed: totalPoints,
      }
    })
  }, [sprints, projectIssues])

  const averageVelocity = useMemo(() => {
    if (velocityData.length === 0) return 0
    const total = velocityData.reduce((acc, d) => acc + d.completed, 0)
    return Math.round(total / velocityData.length)
  }, [velocityData])

  const statusDistribution = useMemo(() => {
    if (!sprintMetrics) return []
    
    return [
      { name: 'To Do', value: sprintMetrics.byStatus.todo, color: STATUS_COLORS.todo },
      { name: 'In Progress', value: sprintMetrics.byStatus.in_progress, color: STATUS_COLORS.in_progress },
      { name: 'In Review', value: sprintMetrics.byStatus.in_review, color: STATUS_COLORS.in_review },
      { name: 'Done', value: sprintMetrics.byStatus.done, color: STATUS_COLORS.done },
    ].filter(s => s.value > 0)
  }, [sprintMetrics])

  const handleCreateSprint = async () => {
    if (!projectId || !newSprint.name.trim()) return
    
    try {
      await createSprint({
        projectId,
        name: newSprint.name,
        goal: newSprint.goal,
        startDate: newSprint.startDate ? new Date(newSprint.startDate).toISOString() : undefined,
        endDate: newSprint.endDate ? new Date(newSprint.endDate).toISOString() : undefined,
      })
      
      toast({
        title: 'Sprint Created',
        description: `${newSprint.name} has been created successfully`,
      })
      
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' })
      setShowCreateModal(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create sprint',
      })
    }
  }

  const handleStartSprint = async () => {
    if (!selectedSprint) return
    
    try {
      await startSprint(selectedSprint.id)
      toast({
        title: 'Sprint Started',
        description: `${selectedSprint.name} is now active`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start sprint',
      })
    }
  }

  const handleCompleteSprint = async () => {
    if (!selectedSprint) return
    
    try {
      const incompleteIssues = sprintMetrics?.issues.filter(
        (i: Issue) => i.status !== 'done'
      ) || []
      
      if (incompleteIssues.length > 0) {
        const nextSprint = sprints.find(
          (s: Sprint) => s.status === 'planned' && s.id !== selectedSprint.id
        )
        
        for (const issue of incompleteIssues) {
          await updateIssue(issue.id, {
            ...issue,
            sprintId: incompleteIssueAction === 'next' && nextSprint ? nextSprint.id : undefined,
          })
        }
      }
      
      await completeSprint(selectedSprint.id)
      
      toast({
        title: 'Sprint Completed',
        description: incompleteIssues.length > 0 
          ? `${incompleteIssues.length} incomplete issues moved to ${incompleteIssueAction === 'next' ? 'next sprint' : 'backlog'}`
          : 'All issues completed!',
      })
      
      setShowCompleteModal(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete sprint',
      })
    }
  }

  const handleUpdateSprint = async () => {
    if (!selectedSprint) return
    
    try {
      await updateSprint(selectedSprint.id, {
        name: newSprint.name || selectedSprint.name,
        goal: newSprint.goal || selectedSprint.goal || undefined,
        startDate: newSprint.startDate ? new Date(newSprint.startDate).toISOString() : selectedSprint.startDate,
        endDate: newSprint.endDate ? new Date(newSprint.endDate).toISOString() : selectedSprint.endDate,
      })
      
      toast({
        title: 'Sprint Updated',
        description: 'Sprint details have been updated',
      })
      
      setShowEditModal(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update sprint',
      })
    }
  }

  const SprintCard = ({ sprint }: { sprint: Sprint }) => {
    const sprintIssues = projectIssues.filter((i: Issue) => i.sprintId === sprint.id)
    const completedPoints = sprintIssues
      .filter((i: Issue) => i.status === 'done')
      .reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
    const totalPoints = sprintIssues.reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
    const progress = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0
    
    const isSelected = selectedSprint?.id === sprint.id
    
    return (
      <div
        onClick={() => setSelectedSprint(sprint)}
        className={cn(
          'p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
          'hover:shadow-lg hover:scale-[1.02] glass-card',
          isSelected 
            ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
            : 'border-slate-800 hover:border-slate-700'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{sprint.name}</h3>
              <Badge 
                className={cn(
                  'text-xs',
                  sprint.status === 'active' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse',
                  sprint.status === 'completed' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  sprint.status === 'planned' && 'bg-slate-700/50 text-slate-400 border-slate-600'
                )}
              >
                {sprint.status}
              </Badge>
            </div>
            {sprint.goal && (
              <p className="text-sm text-slate-400 mt-1 line-clamp-1">{sprint.goal}</p>
            )}
          </div>
          {sprint.status === 'active' && (
            <div className="flex items-center gap-1 text-amber-400">
              <Flame className="w-4 h-4 animate-bounce" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{sprintIssues.length} issues</span>
            <span className="font-medium text-slate-300">{completedPoints}/{totalPoints} pts</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
        </div>
        
        {sprint.startDate && sprint.endDate && (
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <CalendarDays className="w-3 h-3" />
            <span>{format(parseISO(sprint.startDate), 'MMM dd')} - {format(parseISO(sprint.endDate), 'MMM dd')}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20"
            style={{ backgroundColor: currentProject?.color || '#06b6d4' }}
          >
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Sprint Management
            </h1>
            <p className="text-slate-400 text-sm">
              {currentProject?.name} • {sprints.length} sprints
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/projects/${projectId}/backlog`)}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Target className="w-4 h-4 mr-2" />
            Backlog
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-neon"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Sprint
          </Button>
        </div>
      </div>

      {/* Sprint Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sprints.map((sprint: Sprint) => (
          <SprintCard key={sprint.id} sprint={sprint} />
        ))}
      </div>

      {/* Selected Sprint Details */}
      {selectedSprint && sprintMetrics && (
        <div className="space-y-6">
          {/* Sprint Header */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 transition-opacity" />
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
                    selectedSprint.status === 'active' 
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' 
                      : selectedSprint.status === 'completed'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                        : 'bg-slate-700 shadow-xl'
                  )}>
                    {selectedSprint.status === 'active' ? (
                      <Play className="w-6 h-6 text-white" />
                    ) : selectedSprint.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <Calendar className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white">
                        {selectedSprint.name}
                      </h2>
                      <Badge 
                        className={cn(
                          'text-sm',
                          selectedSprint.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                        )}
                      >
                        {selectedSprint.status}
                      </Badge>
                    </div>
                    {selectedSprint.goal && (
                      <p className="text-slate-400 mt-1">{selectedSprint.goal}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewSprint({
                        name: selectedSprint.name,
                        goal: selectedSprint.goal || '',
                        startDate: selectedSprint.startDate ? format(parseISO(selectedSprint.startDate), 'yyyy-MM-dd') : '',
                        endDate: selectedSprint.endDate ? format(parseISO(selectedSprint.endDate), 'yyyy-MM-dd') : '',
                      })
                      setShowEditModal(true)
                    }}
                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  
                  {selectedSprint.status === 'planned' && sprintMetrics.totalIssues > 0 && (
                    <Button
                      onClick={handleStartSprint}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                      disabled={isLoading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Sprint
                    </Button>
                  )}
                  
                  {selectedSprint.status === 'active' && (
                    <Button
                      onClick={() => setShowCompleteModal(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      disabled={isLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Sprint
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Sprint Timeline */}
              {selectedSprint.startDate && selectedSprint.endDate && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-400">
                      {format(parseISO(selectedSprint.startDate), 'MMM dd, yyyy')}
                    </span>
                    <span className="font-medium text-cyan-400">
                      {sprintMetrics.daysRemaining} days remaining
                    </span>
                    <span className="text-slate-400">
                      {format(parseISO(selectedSprint.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      style={{ 
                        width: `${Math.min(100, (sprintMetrics.daysElapsed / sprintMetrics.totalDays) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Issues</p>
                  <p className="text-2xl font-bold text-white">{sprintMetrics.totalIssues}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Story Points</p>
                  <p className="text-2xl font-bold text-white">{sprintMetrics.totalPoints}</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Completed</p>
                  <p className="text-2xl font-bold text-white">{sprintMetrics.completionPercentage}%</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-xl border-l-4 border-l-amber-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Velocity</p>
                  <p className="text-2xl font-bold text-white">{averageVelocity} pts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-700">
            {['overview', 'burndown', 'velocity', 'capacity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-all',
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  Issue Distribution
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ 
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sprint Issues List */}
              <div className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-500" />
                    Sprint Issues
                  </h3>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400">{sprintMetrics.totalIssues} total</Badge>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                  {sprintMetrics.issues.map((issue: Issue) => (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50 cursor-pointer transition-colors group"
                    >
                      <div 
                        className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]"
                        style={{ backgroundColor: STATUS_COLORS[issue.status], color: STATUS_COLORS[issue.status] }}
                      />
                      <span className="text-xs font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">{issue.key}</span>
                      <span className="flex-1 text-sm font-medium text-slate-300 truncate group-hover:text-white transition-colors">{issue.title}</span>
                      {issue.storyPoints && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">{issue.storyPoints} pts</Badge>
                      )}
                      {issue.assignee && (
                        <Avatar className="w-6 h-6 ring-1 ring-slate-600">
                          <AvatarFallback className="text-[10px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                            {getInitials(issue.assignee.firstName, issue.assignee.lastName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'burndown' && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                  Burndown Chart
                </h3>
                <p className="text-sm text-slate-400">Track remaining work vs ideal progress</p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={burndownData}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="ideal" 
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Ideal"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="actual" 
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      fill="url(#colorActual)"
                      name="Actual"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'velocity' && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-cyan-500" />
                  Velocity Chart
                </h3>
                <p className="text-sm text-slate-400">Story points completed vs committed per sprint</p>
              </div>
              {velocityData.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
                  <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
                  <p>No completed sprints yet</p>
                  <p className="text-sm">Complete sprints to see velocity data</p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="committed" 
                        fill={CHART_COLORS.secondary}
                        radius={[4, 4, 0, 0]}
                        name="Committed"
                      />
                      <Bar 
                        dataKey="completed" 
                        fill={CHART_COLORS.success}
                        radius={[4, 4, 0, 0]}
                        name="Completed"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {activeTab === 'capacity' && (
            <div className="glass-card p-6 rounded-2xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-500" />
                  Team Capacity
                </h3>
                <p className="text-sm text-slate-400">Story points distribution across team members</p>
              </div>
              {(() => {
                // Calculate capacity data per team member
                const capacityData = sprintMetrics?.issues.reduce((acc: any[], issue: Issue) => {
                  const assigneeName = issue.assignee 
                    ? `${issue.assignee.firstName} ${issue.assignee.lastName}`
                    : 'Unassigned'
                  const existing = acc.find(a => a.name === assigneeName)
                  const points = issue.storyPoints || 0
                  const isCompleted = issue.status === 'done'
                  
                  if (existing) {
                    existing.total += points
                    if (isCompleted) existing.completed += points
                    else existing.remaining += points
                    existing.issues += 1
                  } else {
                    acc.push({
                      name: assigneeName,
                      total: points,
                      completed: isCompleted ? points : 0,
                      remaining: isCompleted ? 0 : points,
                      issues: 1,
                    })
                  }
                  return acc
                }, []) || []

                // Sort by total points descending
                capacityData.sort((a: any, b: any) => b.total - a.total)

                if (capacityData.length === 0) {
                  return (
                    <div className="h-80 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700/50 rounded-xl">
                      <Users className="w-12 h-12 mb-3 opacity-30" />
                      <p>No issues in this sprint</p>
                      <p className="text-sm">Add issues to see capacity data</p>
                    </div>
                  )
                }

                return (
                  <div className="space-y-6">
                    {/* Bar Chart */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={capacityData} layout="vertical" barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} stroke="#475569" />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#94a3b8' }} 
                            stroke="#475569" 
                            width={120}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b',
                              borderColor: '#334155',
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="completed" 
                            stackId="a"
                            fill={CHART_COLORS.success}
                            radius={[0, 0, 0, 0]}
                            name="Completed"
                          />
                          <Bar 
                            dataKey="remaining" 
                            stackId="a"
                            fill={CHART_COLORS.warning}
                            radius={[0, 4, 4, 0]}
                            name="Remaining"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {capacityData.map((member: any) => {
                        const progress = member.total > 0 ? (member.completed / member.total) * 100 : 0
                        return (
                          <div 
                            key={member.name}
                            className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8 ring-2 ring-slate-700">
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                                    {member.name === 'Unassigned' ? '?' : member.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-white text-sm">{member.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                {member.issues} {member.issues === 1 ? 'issue' : 'issues'}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Progress</span>
                                <span className="text-slate-300">{member.completed}/{member.total} pts</span>
                              </div>
                              <Progress value={progress} className="h-2 bg-slate-700" />
                              <div className="flex justify-between text-xs">
                                <span className="text-emerald-400">{Math.round(progress)}% done</span>
                                <span className="text-amber-400">{member.remaining} pts left</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Modals will be added here (Create, Edit, Complete) - reusing simplified structure */}
      {/* Create Sprint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-2xl animate-scale-in p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create Sprint</h3>
            <div className="space-y-4">
              <Input
                placeholder="Sprint Name"
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                className="bg-slate-900/50 border-slate-700"
              />
               <Input
                placeholder="Goal"
                value={newSprint.goal}
                onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                className="bg-slate-900/50 border-slate-700"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  className="bg-slate-900/50 border-slate-700"
                />
                <Input
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateSprint} className="flex-1 btn-neon">Create</Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Sprint Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-2xl animate-scale-in p-6">
            <h3 className="text-xl font-bold text-white mb-4">Edit Sprint</h3>
            <div className="space-y-4">
              <Input
                placeholder="Sprint Name"
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                className="bg-slate-900/50 border-slate-700"
              />
              <Input
                placeholder="Goal"
                value={newSprint.goal}
                onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                className="bg-slate-900/50 border-slate-700"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  className="bg-slate-900/50 border-slate-700"
                />
                <Input
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleUpdateSprint} className="flex-1 btn-neon">Update</Button>
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Sprint Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-md glass-card rounded-2xl animate-scale-in p-6">
            <h3 className="text-xl font-bold text-white mb-4">Complete Sprint: {selectedSprint?.name}</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-sm text-slate-300 flex justify-between">
                  <span>Completed Issues:</span>
                  <span className="font-bold text-emerald-400">{sprintMetrics?.completedPoints} pts</span>
                </p>
                <p className="text-sm text-slate-300 flex justify-between mt-2">
                  <span>Incomplete Issues:</span>
                  <span className="font-bold text-amber-400">{sprintMetrics?.remainingPoints} pts</span>
                </p>
              </div>

              {(sprintMetrics?.remainingPoints ?? 0) > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Move incomplete issues to:</label>
                  <select
                    className="w-full h-10 rounded-xl bg-slate-900/50 border border-slate-700 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    value={incompleteIssueAction}
                    onChange={(e) => setIncompleteIssueAction(e.target.value as any)}
                  >
                    <option value="backlog">Backlog</option>
                    <option value="next">New Sprint</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCompleteSprint} className="flex-1 btn-neon">Complete</Button>
                <Button variant="outline" onClick={() => setShowCompleteModal(false)} className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => {
            setSelectedIssue(null)
            if (projectId) fetchIssues(projectId)
          }}
        />
      )}
    </div>
  )
}
