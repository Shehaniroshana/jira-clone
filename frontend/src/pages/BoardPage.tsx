
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CreateIssueInput } from '@/types'
import {
  Plus, ArrowLeft, Search, X,
  CheckCircle2, AlertCircle, Bug, BookOpen, Layers,
  Rocket, Zap, Target, Clock, Sparkles, User
} from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import IssueDetailModal from '@/components/IssueDetailModal'
import type { Issue } from '@/types'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

// Neon Theme Colors
const THEME = {
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
}

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: '#64748b',
    gradient: 'from-slate-500/20 to-slate-600/10',
    icon: Target,
    glow: 'rgba(100, 116, 139, 0.3)'
  },
  in_progress: {
    label: 'In Progress',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/10',
    icon: Zap,
    glow: 'rgba(59, 130, 246, 0.3)'
  },
  in_review: {
    label: 'In Review',
    color: '#8b5cf6',
    gradient: 'from-purple-500/20 to-purple-600/10',
    icon: Clock,
    glow: 'rgba(139, 92, 246, 0.3)'
  },
  done: {
    label: 'Done',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    icon: CheckCircle2,
    glow: 'rgba(16, 185, 129, 0.3)'
  },
}

const ISSUE_TYPES = [
  { id: 'story', label: 'Story', icon: BookOpen, color: '#10b981', bg: 'bg-emerald-500/20' },
  { id: 'task', label: 'Task', icon: CheckCircle2, color: '#3b82f6', bg: 'bg-blue-500/20' },
  { id: 'bug', label: 'Bug', icon: Bug, color: '#f43f5e', bg: 'bg-rose-500/20' },
  { id: 'epic', label: 'Epic', icon: Layers, color: '#8b5cf6', bg: 'bg-purple-500/20' },
]

const PRIORITY_CONFIG: Record<string, { color: string; glow: string; label: string }> = {
  highest: { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', label: 'Highest' },
  high: { color: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', label: 'High' },
  medium: { color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', label: 'Medium' },
  low: { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', label: 'Low' },
  lowest: { color: '#64748b', glow: 'rgba(100, 116, 139, 0.3)', label: 'Lowest' },
}

// Animated Stats Card Component
const StatsCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
  <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-card">
    <div
      className="p-2 rounded-lg"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  </div>
)

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues, updateIssue, createIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints } = useSprintStore()
  const { toast } = useToast()

  const { user } = useAuthStore()
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'mine'>('all')
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<CreateIssueInput>>({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
  })

  useEffect(() => {
    if (projectId) {
      Promise.all([
        fetchProject(projectId),
        fetchIssues(projectId),
        fetchSprints(projectId)
      ]).finally(() => setIsLoading(false))
    }
  }, [projectId, fetchProject, fetchIssues, fetchSprints])

  const activeSprint = sprints.find(s => s.status === 'active')

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!projectId || !currentProject) {
      setError('Project not found')
      return
    }

    if (!formData.title?.trim()) {
      setError('Title is required')
      return
    }

    try {
      const issueData: CreateIssueInput = {
        projectId,
        projectKey: currentProject.key,
        title: formData.title,
        description: formData.description || '',
        type: formData.type || 'task',
        priority: formData.priority || 'medium',
        sprintId: activeSprint?.id,
        assigneeId: formData.assigneeId,
        storyPoints: formData.storyPoints,
      }

      await createIssue(issueData)

      toast({
        title: 'Issue Created',
        description: `New ${formData.type} has been created and added to the sprint!`,
      })

      setShowCreateIssueModal(false)
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
      })
      if (projectId) fetchIssues(projectId)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create issue'
      setError(errorMessage)
    }
  }

  const boardIssues = (issues[projectId || ''] || []) as Issue[]

  const sprintIssues = activeSprint
    ? boardIssues.filter(i => {
      if (i.sprintId !== activeSprint.id) return false
      if (searchQuery && !i.title.toLowerCase().includes(searchQuery.toLowerCase()) && !i.key.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (userFilter === 'mine' && i.assigneeId !== user?.id) {
        return false
      }
      return true
    })
    : []

  const columns = {
    todo: sprintIssues.filter(i => i.status === 'todo' && i.type !== 'subtask'),
    in_progress: sprintIssues.filter(i => i.status === 'in_progress' && i.type !== 'subtask'),
    in_review: sprintIssues.filter(i => i.status === 'in_review' && i.type !== 'subtask'),
    done: sprintIssues.filter(i => i.status === 'done' && i.type !== 'subtask'),
  }

  // Stats
  const totalIssues = sprintIssues.filter(i => i.type !== 'subtask').length
  const totalPoints = sprintIssues.reduce((acc, i) => acc + (i.storyPoints || 0), 0)
  const completedPoints = columns.done.reduce((acc, i) => acc + (i.storyPoints || 0), 0)

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const issue = boardIssues.find(i => i.id === draggableId)
    if (!issue) return

    const newStatus = destination.droppableId as keyof typeof STATUS_CONFIG

    try {
      await updateIssue(issue.id, { ...issue, status: newStatus })
      toast({
        title: 'Issue Updated',
        description: `Issue moved to ${STATUS_CONFIG[newStatus].label}`,
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update issue',
        variant: 'destructive',
      })
    }
  }

  const getTypeConfig = (type: string) => {
    return ISSUE_TYPES.find(t => t.id === type) || ISSUE_TYPES[1]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
          </div>
          <p className="text-slate-400">Loading board...</p>
        </div>
      </div>
    )
  }

  if (!activeSprint) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)} className="hover:bg-cyan-500/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Sprint Board</h1>
            <p className="text-sm text-slate-400 mt-1">{currentProject?.name}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center mb-6 mx-auto border border-slate-700/50">
              <Rocket className="w-12 h-12 text-cyan-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Sprint</h2>
            <p className="text-slate-400 max-w-md mb-8">
              Start a sprint from the backlog to begin tracking work on this board.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/backlog`)} className="btn-neon">
              <Rocket className="w-4 h-4 mr-2" />
              Go to Backlog
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)} className="hover:bg-cyan-500/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-tight">
                  <span className="text-gradient-animate">Sprint Board</span>
                </h1>
                <div
                  className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border"
                  style={{
                    backgroundColor: `${THEME.cyan}15`,
                    borderColor: `${THEME.cyan}30`,
                    color: THEME.cyan,
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {activeSprint.name}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">{currentProject?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreateIssueModal(true)}
              className="btn-neon gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Create Issue
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <StatsCard label="Total Issues" value={totalIssues} icon={Layers} color={THEME.cyan} />
          <StatsCard label="In Progress" value={columns.in_progress.length} icon={Zap} color={THEME.blue} />
          <StatsCard label="Done" value={columns.done.length} icon={CheckCircle2} color={THEME.emerald} />
          <StatsCard label="Points" value={`${completedPoints}/${totalPoints}` as any} icon={Target} color={THEME.purple} />

          {/* Progress Bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Sprint Progress</span>
              <span>{totalIssues > 0 ? Math.round((columns.done.length / totalIssues) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${totalIssues > 0 ? (columns.done.length / totalIssues) * 100 : 0}%`,
                  background: `linear-gradient(90deg, ${THEME.emerald} 0%, ${THEME.cyan} 100%)`,
                  boxShadow: `0 0 20px ${THEME.emerald}50`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-3 glass-card rounded-xl border border-slate-700/30">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="h-6 w-px bg-slate-700/50" />

          <button
            onClick={() => setUserFilter(userFilter === 'mine' ? 'all' : 'mine')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              userFilter === 'mine'
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            <User className="w-4 h-4" />
            My Issues
          </button>

          {(searchQuery || userFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setUserFilter('all'); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {Object.entries(columns).map(([status, statusIssues]) => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
            const Icon = config.icon

            return (
              <div key={status} className="space-y-3">
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl glass-card bg-gradient-to-r ${config.gradient}`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <h2 className="text-sm font-semibold text-white">{config.label}</h2>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: `${config.color}20`,
                      color: config.color,
                    }}
                  >
                    {statusIssues.length}
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={status} type="ISSUE">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'space-y-3 min-h-[500px] p-3 rounded-xl glass-panel transition-all duration-200',
                        snapshot.isDraggingOver && 'ring-2 ring-cyan-500/30'
                      )}
                      style={{
                        boxShadow: snapshot.isDraggingOver ? `0 0 30px ${config.glow}` : 'none',
                      }}
                    >
                      {statusIssues.map((issue, index) => {
                        const typeConfig = getTypeConfig(issue.type)

                        return (
                          <Draggable key={issue.id} draggableId={issue.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'group relative glass-card-hover rounded-xl p-4 cursor-grab active:cursor-grabbing',
                                  snapshot.isDragging && 'shadow-2xl ring-2 ring-cyan-500/50 rotate-2 scale-105 !opacity-95',
                                  !snapshot.isDragging && 'hover:-translate-y-1'
                                )}
                                onClick={() => !snapshot.isDragging && setSelectedIssue(issue)}
                              >
                                <div>
                                  {/* Header Row */}
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className="text-xs font-bold tracking-wide"
                                      style={{ color: THEME.cyan }}
                                    >
                                      {issue.key}
                                    </span>
                                    <div
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                      style={{
                                        backgroundColor: `${typeConfig.color}20`,
                                        color: typeConfig.color,
                                      }}
                                    >
                                      <typeConfig.icon className="w-3 h-3" />
                                      {typeConfig.label}
                                    </div>
                                  </div>

                                  {/* Title */}
                                  <p className="text-sm font-medium text-white mb-3 line-clamp-2 group-hover:text-cyan-100 transition-colors">
                                    {issue.title}
                                  </p>

                                  {/* Footer */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {issue.storyPoints && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/80 text-xs text-slate-400">
                                          <Target className="w-3 h-3" />
                                          {issue.storyPoints}
                                        </div>
                                      )}
                                    </div>

                                    {issue.assignee ? (
                                      <Avatar className="w-6 h-6 border-2 border-slate-700">
                                        <AvatarFallback
                                          className="text-[10px] font-semibold"
                                          style={{
                                            background: `linear-gradient(135deg, ${THEME.cyan} 0%, ${THEME.blue} 100%)`,
                                            color: 'white',
                                          }}
                                        >
                                          {getInitials(`${issue.assignee.firstName} ${issue.assignee.lastName}`)}
                                        </AvatarFallback>
                                      </Avatar>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center">
                                        <User className="w-3 h-3 text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}

                      {/* Empty State */}
                      {statusIssues.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Sparkles className="w-8 h-8 text-slate-700 mb-2" />
                          <p className="text-xs text-slate-600">Drop issues here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={() => fetchIssues(projectId!)}
        />
      )}

      {/* Create Issue Modal */}
      {showCreateIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="w-full max-w-lg animate-scale-in glass-card border border-slate-700/50 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 p-6">
              <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20">
                      <Plus className="w-5 h-5 text-cyan-400" />
                    </div>
                    <CardTitle className="text-white">Create Issue</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateIssueModal(false)} className="hover:bg-slate-800">
                    <X className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleCreateIssue} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Title *</label>
                  <Input
                    placeholder="What needs to be done?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500 backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    placeholder="Add details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-[100px] bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                    >
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {ISSUE_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id} className="text-white focus:bg-slate-800">
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" style={{ color: type.color }} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                    >
                      <SelectTrigger className="w-full bg-slate-900/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700">
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key} className="text-white focus:bg-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Story Points</label>
                  <Input
                    type="number"
                    placeholder="Estimate effort"
                    value={formData.storyPoints || ''}
                    onChange={(e) => setFormData({ ...formData, storyPoints: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 btn-neon">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Issue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateIssueModal(false)}
                    className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  )
}
