
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useIssueStore } from '@/store/issueStore'
import { useProjectStore } from '@/store/projectStore'
import { useSprintStore } from '@/store/sprintStore'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Plus, ArrowLeft, Filter, Settings,
  CheckCircle2, Circle, AlertCircle, Bug, BookOpen, Layers,
  Rocket
} from 'lucide-react'
import { getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import IssueDetailModal from '@/components/IssueDetailModal'
import type { Issue } from '@/types'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-slate-700' },
  in_progress: { label: 'In Progress', color: 'bg-blue-600' },
  in_review: { label: 'In Review', color: 'bg-purple-600' },
  done: { label: 'Done', color: 'bg-emerald-600' },
}

const ISSUE_TYPES = [
  { id: 'story', label: 'Story', icon: BookOpen, color: 'text-green-400' },
  { id: 'task', label: 'Task', icon: CheckCircle2, color: 'text-blue-400' },
  { id: 'bug', label: 'Bug', icon: Bug, color: 'text-red-400' },
  { id: 'epic', label: 'Epic', icon: Layers, color: 'text-purple-400' },
]

const PRIORITY_COLORS: Record<string, string> = {
  highest: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  lowest: 'bg-slate-500',
}

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { issues, fetchIssues, updateIssue } = useIssueStore()
  const { currentProject, fetchProject } = useProjectStore()
  const { sprints, fetchSprints } = useSprintStore()
  const { toast } = useToast()

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
  const boardIssues = (issues[projectId || ''] || []) as Issue[]

  // Filter issues for the active sprint
  const sprintIssues = activeSprint
    ? boardIssues.filter(i => i.sprintId === activeSprint.id)
    : []

  const columns = {
    todo: sprintIssues.filter(i => i.status === 'todo' && i.type !== 'subtask'),
    in_progress: sprintIssues.filter(i => i.status === 'in_progress' && i.type !== 'subtask'),
    in_review: sprintIssues.filter(i => i.status === 'in_review' && i.type !== 'subtask'),
    done: sprintIssues.filter(i => i.status === 'done' && i.type !== 'subtask'),
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const issue = boardIssues.find(i => i.id === draggableId)
    if (!issue) return

    const newStatus = destination.droppableId as any

    try {
      await updateIssue(issue.id, { ...issue, status: newStatus })
      toast({
        title: 'Issue Updated',
        description: `Issue moved to ${STATUS_CONFIG[newStatus].label}`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update issue',
        variant: 'destructive',
      })
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = ISSUE_TYPES.find(t => t.id === type)
    if (!typeConfig) return null
    const Icon = typeConfig.icon
    return <Icon className={`w-4 h-4 ${typeConfig.color}`} />
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold text-white">Board</h1>
        </div>
        <div className="text-slate-400">Loading board...</div>
      </div>
    )
  }

  if (!activeSprint) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Board</h1>
              <p className="text-sm text-slate-400 mt-1">{currentProject?.name}</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl border-dashed border-2 border-slate-700">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
            <Rocket className="w-10 h-10 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">No Active Sprint</h2>
          <p className="text-slate-400 max-w-md mb-8">
            There is no active sprint in this project. Go to the Backlog to create and start a sprint.
          </p>
          <Button
            onClick={() => navigate(`/projects/${projectId}/backlog`)}
            className="btn-neon"
          >
            Go to Backlog
          </Button>
        </div>
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Board</h1>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                {activeSprint.name}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">{currentProject?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
            variant="outline"
            size="sm"
            onClick={async () => {
              // Complete Sprint Logic could go here or navigate to completion page
              navigate(`/projects/${projectId}/backlog`) // Just redirect to backlog for management for now
            }}
          >
            Complete Sprint
          </Button>
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([status, statusIssues]) => (
            <div key={status} className="space-y-2">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].color}`} />
                  <h2 className="text-sm font-semibold text-white">
                    {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                  </h2>
                  <Badge variant="secondary" className="ml-auto">
                    {statusIssues.length}
                  </Badge>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={status} type="ISSUE">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-2 min-h-96 p-2 rounded-lg transition-colors',
                      snapshot.isDraggingOver ? 'bg-slate-800/50' : 'bg-transparent'
                    )}
                  >
                    {statusIssues.map((issue, index) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'glass-card p-3 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-lg transition-all',
                              snapshot.isDragging && 'shadow-2xl opacity-95'
                            )}
                            onClick={() => setSelectedIssue(issue)}
                          >
                            {/* Issue Key */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-cyan-400">
                                {issue.key}
                              </span>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[issue.priority] }} />
                            </div>

                            {/* Issue Title */}
                            <p className="text-sm font-medium text-white mb-2 line-clamp-2 hover:text-cyan-400">
                              {issue.title}
                            </p>

                            {/* Issue Type and Story Points */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-1">
                                {getTypeIcon(issue.type)}
                                <span className="text-xs text-slate-400">
                                  {ISSUE_TYPES.find(t => t.id === issue.type)?.label}
                                </span>
                              </div>
                              {issue.storyPoints && (
                                <Badge variant="secondary" className="text-xs">
                                  {issue.storyPoints} pts
                                </Badge>
                              )}
                            </div>

                            {/* Assignee */}
                            {issue.assignee && (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(`${issue.assignee.firstName} ${issue.assignee.lastName}`)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-slate-400">
                                  {issue.assignee.firstName}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
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
    </div>
  )
}
