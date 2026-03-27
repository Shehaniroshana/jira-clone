import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Search, CheckCircle2, Circle,
  Target, Zap, Play, ChevronDown, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBacklog } from '@/hooks/useBacklog'
import { IssueRow } from '@/components/issues/IssueRow'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import IssueDetailModal from '@/components/IssueDetailModal'
import type { Sprint } from '@/types'

export default function BacklogPage() {
  const navigate = useNavigate()
  const bl = useBacklog()

  return (
    <DragDropContext onDragEnd={bl.onDragEnd}>
      <div className="space-y-6 animate-fade-in pb-10">

        {/* Header */}
        <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20"
              style={{ backgroundColor: bl.currentProject?.color ?? '#4F46E5' }}
            >
              {bl.currentProject?.key?.substring(0, 2) ?? 'PR'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Backlog</h1>
              <p className="text-slate-400 text-sm">
                {bl.currentProject?.name} • {bl.projectIssues.length} issues
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Search backlog..."
                value={bl.searchQuery}
                onChange={(e) => bl.setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-slate-900/50 border-slate-700 focus:border-cyan-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => bl.setShowCreateSprint(true)}
              className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Sprint
            </Button>
            <Button className="btn-neon" onClick={() => navigate(`/projects/${bl.projectId}/board`)}>
              <Target className="w-4 h-4 mr-2" />
              Go to Board
            </Button>
          </div>
        </div>

        {/* Sprint sections */}
        <div className="space-y-4">
          {bl.sprints.map((sprint: Sprint) => {
            const isExpanded = bl.expandedSprints.includes(sprint.id)
            const sprintIssues = bl.getSprintIssues(sprint.id)
            const stats = bl.calculateSprintStats(sprint.id)

            return (
              <div key={sprint.id} className="rounded-2xl transition-all duration-300 glass-card">
                {/* Sprint header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl flex items-center justify-between"
                  onClick={() => bl.toggleSprint(sprint.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{sprint.name}</h3>
                        <Badge className={sprint.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400 border-slate-600'}
                        >
                          {sprint.status}
                        </Badge>
                      </div>
                      {sprint.goal && <p className="text-sm text-slate-500 mt-0.5">{sprint.goal}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="text-right text-sm">
                      <p className="text-slate-500">{stats.issueCount} issues</p>
                      <p className="font-medium text-slate-300">{stats.completedPoints}/{stats.totalPoints} pts</p>
                    </div>
                    {sprint.status === 'planned' && sprintIssues.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => bl.handleStartSprint(sprint.id)}
                        className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Sprint
                      </Button>
                    )}
                  </div>
                </div>

                {/* Droppable sprint body */}
                <Droppable droppableId={sprint.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'relative',
                        isExpanded ? 'p-4 border-t border-slate-800/50 mt-2' : 'h-0 p-0 border-0 overflow-hidden',
                        snapshot.isDraggingOver && !isExpanded && 'h-auto min-h-[100px] p-4 bg-cyan-500/5 ring-2 ring-cyan-500/20',
                      )}
                    >
                      {sprintIssues.length === 0 && !snapshot.isDraggingOver && (
                        <div className={cn('py-8 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl', isExpanded ? 'block' : 'hidden')}>
                          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>Drag issues here to plan this sprint</p>
                        </div>
                      )}
                      <div className={cn('space-y-2', !isExpanded && !snapshot.isDraggingOver ? 'hidden' : 'block')}>
                        {sprintIssues.map((issue, index) => (
                          <IssueRow
                            key={issue.id}
                            issue={issue}
                            index={index}
                            movingIssueId={bl.movingIssueId}
                            onMoveToBacklog={bl.onMoveToBacklog}
                            onMouseDown={(e) => bl.setDragStartPos({ x: e.clientX, y: e.clientY })}
                            onMouseUp={(issue, e) => bl.handleIssueClick(issue, e)}
                          />
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

        {/* Backlog section */}
        <div className="rounded-xl glass-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Backlog</h3>
                <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                  {bl.backlogIssues.length} issues
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={bl.openCreateIssueModal}
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
                  'p-4 flex-1 relative min-h-[300px]',
                  snapshot.isDraggingOver ? 'bg-cyan-500/10' : 'bg-transparent',
                )}
              >
                {bl.backlogIssues.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none p-4">
                    <CheckCircle2 className={cn('w-12 h-12 mb-3 transition-opacity duration-200', snapshot.isDraggingOver ? 'opacity-10' : 'opacity-20')} />
                    <p className={cn('text-lg font-medium transition-opacity duration-200', snapshot.isDraggingOver ? 'opacity-10' : 'opacity-100')}>Backlog is empty!</p>
                    <p className={cn('text-sm mt-1 transition-opacity duration-200', snapshot.isDraggingOver ? 'opacity-10' : 'opacity-100')}>All issues are assigned to sprints</p>
                  </div>
                )}
                <div className="space-y-2 relative z-10">
                  {bl.backlogIssues.map((issue, index) => (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      index={index}
                      movingIssueId={bl.movingIssueId}
                      onMoveToBacklog={bl.onMoveToBacklog}
                      onMouseDown={(e) => bl.setDragStartPos({ x: e.clientX, y: e.clientY })}
                      onMouseUp={(issue, e) => bl.handleIssueClick(issue, e)}
                    />
                  ))}
                </div>
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Create Sprint Modal */}
        {bl.showCreateSprint && (
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
                    value={bl.newSprintName}
                    onChange={(e) => bl.setNewSprintName(e.target.value)}
                    autoFocus
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={bl.handleCreateSprint}
                    className="flex-1 btn-neon"
                    disabled={!bl.newSprintName.trim() || bl.sprintLoading}
                  >
                    Create Sprint
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => bl.setShowCreateSprint(false)}
                    className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issue Detail Modal */}
        {bl.selectedIssue && (
          <IssueDetailModal
            issue={bl.selectedIssue}
            onClose={() => {
              bl.setSelectedIssue(null)
              if (bl.projectId) bl.fetchIssues(bl.projectId)
            }}
          />
        )}

        {/* Create Issue Modal */}
        <CreateIssueModal
          isOpen={bl.showCreateIssueModal}
          onClose={bl.closeCreateIssueModal}
          formData={bl.formData}
          onChange={bl.setFormData}
          onSubmit={bl.handleCreateIssue}
          error={bl.formError}
        />
      </div>
    </DragDropContext>
  )
}
