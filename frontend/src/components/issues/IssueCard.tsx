import { Draggable } from '@hello-pangea/dnd'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Target } from 'lucide-react'
import { User } from 'lucide-react'
import type { Issue } from '@/types'
import { getIssueTypeConfig } from '@/constants'
import { BOARD_THEME } from '@/constants/board'
import { getInitials, cn } from '@/lib/utils'

interface IssueCardProps {
  issue: Issue
  index: number
  onClick: (issue: Issue) => void
}

export function IssueCard({ issue, index, onClick }: IssueCardProps) {
  const typeConfig = getIssueTypeConfig(issue.type)
  const TypeIcon = typeConfig.icon

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
            !snapshot.isDragging && 'hover:-translate-y-1',
          )}
          onClick={() => !snapshot.isDragging && onClick(issue)}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wide" style={{ color: BOARD_THEME.cyan }}>
              {issue.key}
            </span>
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
            >
              <TypeIcon className="w-3 h-3" />
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
                  style={{ background: `linear-gradient(135deg, ${BOARD_THEME.cyan} 0%, ${BOARD_THEME.blue} 100%)`, color: 'white' }}
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
      )}
    </Draggable>
  )
}
