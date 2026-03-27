import { Draggable } from '@hello-pangea/dnd'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GripVertical, ArrowDownToLine } from 'lucide-react'
import type { Issue } from '@/types'
import { getIssueTypeConfig, getPriorityDotClass } from '@/constants'
import { getInitials, cn } from '@/lib/utils'

interface IssueRowProps {
  issue: Issue
  index: number
  movingIssueId?: string | null
  onMoveToBacklog?: (issue: Issue) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseUp?: (issue: Issue, e: React.MouseEvent) => void
}

export function IssueRow({ issue, index, movingIssueId, onMoveToBacklog, onMouseDown, onMouseUp }: IssueRowProps) {
  const typeConfig = getIssueTypeConfig(issue.type)
  const TypeIcon = typeConfig.icon

  return (
    <Draggable draggableId={issue.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseDown={onMouseDown}
          onMouseUp={(e) => onMouseUp?.(issue, e)}
          className={cn(
            'flex items-center gap-4 p-4 glass-card hover:bg-slate-800/80 rounded-xl transition-colors cursor-grab active:cursor-grabbing group border border-slate-800 hover:border-cyan-500/30',
            snapshot.isDragging && 'shadow-2xl ring-2 ring-cyan-500 bg-slate-800 opacity-100 z-[100] relative',
          )}
        >
          <GripVertical className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-all" />

          {/* Type + Key */}
          <div className="flex items-center gap-3 min-w-[120px]">
            <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500/10 transition-colors">
              <div className={`w-6 h-6 rounded flex items-center justify-center ${typeConfig.bg}`}>
                <TypeIcon className={`w-3.5 h-3.5 ${typeConfig.textColor}`} />
              </div>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500 group-hover:text-cyan-400 transition-colors">
              {issue.key}
            </span>
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors block truncate">
              {issue.title}
            </span>
          </div>

          {/* Right-side metadata */}
          <div className="flex items-center gap-4">
            {issue.labels && issue.labels.length > 0 && (
              <div className="gap-1.5 hidden md:flex">
                {issue.labels.slice(0, 2).map((label) => (
                  <Badge
                    key={label.id}
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-medium border"
                    style={{ backgroundColor: `${label.color}20`, color: label.color, borderColor: `${label.color}40` }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${getPriorityDotClass(issue.priority)}`}
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

              {issue.sprintId && onMoveToBacklog && (
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    'h-7 w-7 transition-all hover:bg-red-500/10 hover:text-red-400',
                    movingIssueId === issue.id ? 'opacity-50 animate-pulse' : 'opacity-0 group-hover:opacity-100',
                  )}
                  onClick={(e) => { e.stopPropagation(); onMoveToBacklog(issue) }}
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
}
