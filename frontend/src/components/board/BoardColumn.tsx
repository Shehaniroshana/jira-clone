import { Droppable } from '@hello-pangea/dnd'
import { Sparkles } from 'lucide-react'
import { IssueCard } from '@/components/issues/IssueCard'
import { STATUS_CONFIG, type BoardStatus } from '@/constants/board'
import { cn } from '@/lib/utils'
import type { Issue } from '@/types'

interface BoardColumnProps {
  status: BoardStatus
  issues: Issue[]
  onIssueClick: (issue: Issue) => void
}

export function BoardColumn({ status, issues, onIssueClick }: BoardColumnProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <div className="space-y-3">
      {/* Column Header */}
      <div className={`flex items-center justify-between p-3 rounded-xl glass-card bg-gradient-to-r ${config.gradient}`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <h2 className="text-sm font-semibold text-white">{config.label}</h2>
        </div>
        <div
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          {issues.length}
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
              snapshot.isDraggingOver && 'ring-2 ring-cyan-500/30',
            )}
            style={{
              boxShadow: snapshot.isDraggingOver ? `0 0 30px ${config.glow}` : 'none',
            }}
          >
            {issues.map((issue, index) => (
              <IssueCard key={issue.id} issue={issue} index={index} onClick={onIssueClick} />
            ))}
            {provided.placeholder}

            {/* Empty State */}
            {issues.length === 0 && !snapshot.isDraggingOver && (
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
}
