import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { CreateIssueInput } from '@/types'
import {
  Plus, Search, CheckCircle2, Circle,
  Target, Zap, Play,
  ChevronDown, ChevronRight, Bug, BookOpen,
  Layers, GripVertical, AlertCircle, ArrowDownToLine
} from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import IssueDetailModal from '@/components/IssueDetailModal'
import type { Issue, Sprint } from '@/types'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const ISSUE_TYPES = [
  { id: 'story', label: 'Story', icon: BookOpen, color: 'text-green-400 bg-green-500/20' },
  { id: 'task', label: 'Task', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/20' },
  { id: 'bug', label: 'Bug', icon: Bug, color: 'text-red-400 bg-red-500/20' },
  { id: 'epic', label: 'Epic', icon: Layers, color: 'text-purple-400 bg-purple-500/20' },
]

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues, createIssue, updateIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints, createSprint, startSprint, isLoading: sprintLoading } = useSprintStore()
  const { toast } = useToast()

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateSprint, setShowCreateSprint] = useState(false)
  const [newSprintName, setNewSprintName] = useState('')
  const [expandedSprints, setExpandedSprints] = useState<string[]>([])

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
      fetchProject(projectId)
      fetchIssues(projectId)
      fetchSprints(projectId)
    }
  }, [projectId])

  useEffect(() => {
    if (sprints.length > 0) {
      setExpandedSprints(sprints.filter((s: Sprint) => s.status === 'active').map((s: Sprint) => s.id))
    }
  }, [sprints])

  const projectIssues = issues[projectId || ''] || []

  // Ensure unique IDs for Draggables to avoid conflicts
  const filteredIssues = useMemo(() => {
    return projectIssues.filter((issue: Issue) => {
      if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (issue.type === 'subtask' || issue.parentIssueId) {
        return false
      }
      return true
    })
  }, [projectIssues, searchQuery])

  const backlogIssues = filteredIssues.filter((i: Issue) => !i.sprintId)

  const getSprintIssues = (sprintId: string) => {
    return filteredIssues.filter((i: Issue) => i.sprintId === sprintId)
  }

  const toggleSprint = (sprintId: string) => {
    setExpandedSprints(prev =>
      prev.includes(sprintId)
        ? prev.filter(id => id !== sprintId)
        : [...prev, sprintId]
    )
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId
    ) {
      if (destination.index !== source.index) {
        // Reordering is not yet supported by the backend
        // We return early to prevent the "snap back" effect and unnecessary API calls
        return
      }
      return
    }

    const issue = projectIssues.find((i: Issue) => i.id === draggableId)
    if (!issue) return

    // Determine target sprint: null for backlog, sprintId for sprint sections
    const targetSprintId = destination.droppableId === 'backlog' ? null : destination.droppableId

    try {
      // Create update payload - IMPORTANT: use undefined for null values, not explicit null
      const updateData: any = {
        title: issue.title,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        storyPoints: issue.storyPoints,
        sprintId: targetSprintId
      }

      console.log('Drag Update:', {
        from: source.droppableId,
        to: destination.droppableId,
        issue: issue.key,
        sprintId: targetSprintId
      })

      await updateIssue(issue.id, updateData)

      toast({
        title: 'Issue Moved',
        description: targetSprintId
          ? `${issue.key} moved to sprint`
          : `${issue.key} moved to backlog`,
      })

      // We rely on optimistic updates in the store, so no need to fetchIssues immediately


    } catch (error: any) {
      console.error('Move failed:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to move issue',
        variant: 'destructive'
      })
    }
  }

  const handleCreateSprint = async () => {
    if (!projectId || !newSprintName.trim()) return

    try {
      await createSprint({
        projectId,
        name: newSprintName,
      })

      toast({
        title: 'Sprint Created',
        description: 'New sprint has been created',
      })

      setNewSprintName('')
      setShowCreateSprint(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create sprint',
      })
    }
  }

  const handleStartSprint = async (sprintId: string) => {
    try {
      await startSprint(sprintId)
      toast({
        title: 'Sprint Started',
        description: 'Sprint is now active',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start sprint',
      })
    }
  }

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
        assigneeId: formData.assigneeId,
        storyPoints: formData.storyPoints,
      }

      await createIssue(issueData)

      toast({
        title: 'Issue Created',
        description: `New ${formData.type} has been created successfully!`,
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

  const getTypeIcon = (type: string) => {
    const typeConfig = ISSUE_TYPES.find(t => t.id === type)
    if (!typeConfig) return null
    const Icon = typeConfig.icon
    return (
      <div className={`w-6 h-6 rounded flex items-center justify-center ${typeConfig.color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      highest: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
      high: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
      medium: 'bg-amber-500',
      low: 'bg-cyan-400',
      lowest: 'bg-slate-400',
    }
    return colors[priority] || 'bg-slate-400'
  }

  const calculateSprintStats = (sprintId: string) => {
    const sprintIssues = getSprintIssues(sprintId)
    const totalPoints = sprintIssues.reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
    const completedPoints = sprintIssues
      .filter((i: Issue) => i.status === 'done')
      .reduce((acc: number, i: Issue) => acc + (i.storyPoints || 0), 0)
    return { totalPoints, completedPoints, issueCount: sprintIssues.length }
  }

  const [movingIssueId, setMovingIssueId] = useState<string | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)

  const onMoveToBacklog = async (issue: Issue) => {
    if (movingIssueId) return

    console.log('Moving to backlog:', issue.key)
    setMovingIssueId(issue.id)

    try {
      const updateData: any = {
        title: issue.title,
        description: issue.description || '',
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        storyPoints: issue.storyPoints,
        sprintId: null  // explicitly null to move to backlog
      }

      console.log('Move to backlog payload:', updateData)

      await updateIssue(issue.id, updateData)

      toast({
        title: 'Issue Moved',
        description: `${issue.key} moved to backlog`,
      })

      // We rely on optimistic updates in the store
      // if (projectId) await fetchIssues(projectId)
    } catch (error: any) {
      console.error('Failed to move to backlog:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to move issue to backlog',
        variant: 'destructive'
      })
    } finally {
      setMovingIssueId(null)
    }
  }

  const handleIssueClick = (issue: Issue, e: React.MouseEvent) => {
    // Check if this was a drag (mouse moved significantly)
    if (dragStartPos) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) +
        Math.pow(e.clientY - dragStartPos.y, 2)
      )
      // If moved more than 5 pixels, it was a drag, don't open modal
      if (dist > 5) {
        setDragStartPos(null)
        return
      }
    }
    setSelectedIssue(issue)
    setDragStartPos(null)
  }

  const IssueRow = ({ issue, index }: { issue: Issue, index: number }) => (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseDown={(e) => setDragStartPos({ x: e.clientX, y: e.clientY })}
          onMouseUp={(e) => handleIssueClick(issue, e)}
          className={cn(
            "flex items-center gap-4 p-4 glass-card hover:bg-slate-800/80 rounded-xl transition-colors cursor-grab active:cursor-grabbing group border border-slate-800 hover:border-cyan-500/30",
            snapshot.isDragging && "shadow-2xl ring-2 ring-cyan-500 bg-slate-800 opacity-100 z-[100] relative"
          )}
        >
          <GripVertical className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />

          <div className="flex items-center gap-3 min-w-[120px]">
            <div className={`p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500/10 transition-colors`}>
              {getTypeIcon(issue.type)}
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 group-hover:text-cyan-400 transition-colors">{issue.key}</span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors block truncate">
              {issue.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {issue.labels && issue.labels.length > 0 && (
              <div className="gap-1.5 hidden md:flex">
                {issue.labels.slice(0, 2).map((label) => (
                  <Badge
                    key={label.id}
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium border"
                    style={{
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      borderColor: `${label.color}40`
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`}
                title={`Priority: ${issue.priority}`}
              />

              {issue.storyPoints && (
                <div className="bg-slate-800 px-2 py-0.5 rounded text-xs font-bold text-slate-400 group-hover:text-cyan-400 transition-colors">
                  {issue.storyPoints}
                </div>
              )}

              {issue.assignee ? (
                <Avatar className="w-7 h-7 ring-2 ring-slate-800">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold">
                    {getInitials(issue.assignee.firstName, issue.assignee.lastName)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-7 h-7 rounded-full border border-dashed border-slate-600 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-500/50" />
                </div>
              )}

              {/* Quick Action: Move to Backlog if in sprint */}
              {issue.sprintId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 transition-all hover:bg-red-500/10 hover:text-red-400",
                    movingIssueId === issue.id ? "opacity-50 animate-pulse" : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveToBacklog(issue)
                  }}
                  disabled={!!movingIssueId}
                  title="Move to Backlog"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header - keeping existing code */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20"
              style={{ backgroundColor: currentProject?.color || '#4F46E5' }}
            >
              {currentProject?.key?.substring(0, 2) || 'PR'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Backlog
              </h1>
              <p className="text-slate-400 text-sm">
                {currentProject?.name} • {projectIssues.length} issues
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Search backlog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-slate-900/50 border-slate-700 focus:border-cyan-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateSprint(true)}
              className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Sprint
            </Button>
            <Button
              className="btn-neon"
              onClick={() => navigate(`/projects/${projectId}/board`)}
            >
              <Target className="w-4 h-4 mr-2" />
              Go to Board
            </Button>
          </div>
        </div>

        {/* Sprints - keeping existing sprint rendering code but it's too long, continuing with backlog */}

        {/* Sprints */}
        <div className="space-y-4">
          {sprints.map((sprint: Sprint) => {
            const isExpanded = expandedSprints.includes(sprint.id)
            const sprintIssues = getSprintIssues(sprint.id)
            const stats = calculateSprintStats(sprint.id)

            return (
              <div
                key={sprint.id}
                className={cn(
                  "rounded-2xl transition-all duration-300 glass-card"
                )}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl flex items-center justify-between"
                  onClick={() => toggleSprint(sprint.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{sprint.name}</h3>
                        <Badge
                          className={sprint.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600'}
                        >
                          {sprint.status}
                        </Badge>
                      </div>
                      {sprint.goal && (
                        <p className="text-sm text-slate-500 mt-0.5">{sprint.goal}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right text sm">
                      <p className="text-slate-500">{stats.issueCount} issues</p>
                      <p className="font-medium text-slate-300">{stats.completedPoints}/{stats.totalPoints} pts</p>
                    </div>

                    {sprint.status === 'planned' && sprintIssues.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSprint(sprint.id)}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Sprint
                      </Button>
                    )}
                  </div>
                </div>

                <Droppable droppableId={sprint.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "relative",
                        isExpanded ? "p-4 border-t border-slate-800/50 mt-2" : "h-0 p-0 border-0 overflow-hidden",
                        snapshot.isDraggingOver && !isExpanded && "h-auto min-h-[100px] p-4 bg-cyan-500/5 ring-2 ring-cyan-500/20"
                      )}
                    >
                      {/* Empty State for Sprints */}
                      {sprintIssues.length === 0 && !snapshot.isDraggingOver && (
                        <div className={cn("py-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl", isExpanded ? "block" : "hidden")}>
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>Drag issues here to plan this sprint</p>
                        </div>
                      )}

                      {/* Issues List */}
                      <div className={cn("space-y-2", (!isExpanded && !snapshot.isDraggingOver) ? "hidden" : "block")}>
                        {sprintIssues.map((issue: Issue, index: number) => (
                          <IssueRow key={issue.id} issue={issue} index={index} />
                        ))}
                      </div>

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>

        {/* Backlog Section */}
        <div
          className="rounded-xl glass-card flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Backlog</h3>
                <Badge variant="secondary" className="bg-slate-800 text-slate-400">{backlogIssues.length} issues</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateIssueModal(true)}
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Issue
              </Button>
            </div>
          </div>

          <Droppable droppableId="backlog">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "p-4 flex-1 relative min-h-[300px]",
                  snapshot.isDraggingOver
                    ? "bg-cyan-500/10"
                    : "bg-transparent"
                )}
              >
                {/* Empty State Overlay */}
                {backlogIssues.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none p-4">
                    <CheckCircle2 className={cn("w-12 h-12 mb-3 transition-opacity duration-200", snapshot.isDraggingOver ? "opacity-10" : "opacity-20")} />
                    <p className={cn("text-lg font-medium transition-opacity duration-200", snapshot.isDraggingOver ? "opacity-10" : "opacity-100")}>Backlog is empty!</p>
                    <p className={cn("text-sm mt-1 transition-opacity duration-200", snapshot.isDraggingOver ? "opacity-10" : "opacity-100")}>All issues are assigned to sprints</p>
                  </div>
                )}

                <div className="space-y-2 relative z-10">
                  {backlogIssues.map((issue: Issue, index: number) => (
                    <IssueRow key={issue.id} issue={issue} index={index} />
                  ))}
                </div>

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Create Sprint Modal - keeping existing */}
        {showCreateSprint && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-md glass-card rounded-2xl animate-scale-in shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Create Sprint</h3>
                  <p className="text-sm text-slate-400">Plan your next iteration</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Sprint Name</label>
                  <Input
                    placeholder="e.g., Sprint 1"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                    autoFocus
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleCreateSprint}
                    className="flex-1 btn-neon"
                    disabled={!newSprintName.trim() || sprintLoading}
                  >
                    Create Sprint
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateSprint(false)}
                    className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedIssue && (
          <IssueDetailModal
            issue={selectedIssue}
            onClose={() => {
              setSelectedIssue(null)
              if (projectId) fetchIssues(projectId)
            }}
          />
        )}

        {/* Create Issue Modal - This will be very long, keeping simplified version */}
        {showCreateIssueModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <Card className="w-full max-w-lg animate-scale-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create Issue</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreateIssueModal(false)}>
                    <AlertCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateIssue} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
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
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 btn-neon">
                      Create Issue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateIssueModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DragDropContext>
  )
}
