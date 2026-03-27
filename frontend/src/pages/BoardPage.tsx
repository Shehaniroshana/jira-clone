import { useNavigate } from 'react-router-dom'
import { DragDropContext } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Search, X, Rocket, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBoard } from '@/hooks/useBoard'
import { BoardColumn } from '@/components/board/BoardColumn'
import { BoardStatsBar } from '@/components/board/BoardStatsBar'
import { CreateIssueModal } from '@/components/issues/CreateIssueModal'
import IssueDetailModal from '@/components/IssueDetailModal'
import { BOARD_THEME } from '@/constants/board'
import { STATUS_CONFIG, type BoardStatus } from '@/constants/board'

export default function BoardPage() {
  const navigate = useNavigate()
  const board = useBoard()

  // ── Loading state ────────────────────────────────────────────────────
  if (board.isLoading) {
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

  // ── No active sprint ─────────────────────────────────────────────────
  if (!board.activeSprint) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${board.projectId}`)} className="hover:bg-cyan-500/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Sprint Board</h1>
            <p className="text-sm text-slate-400 mt-1">{board.currentProject?.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center mb-6 mx-auto border border-slate-700/50">
              <Rocket className="w-12 h-12 text-cyan-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Sprint</h2>
            <p className="text-slate-400 max-w-md mb-8">Start a sprint from the backlog to begin tracking work on this board.</p>
            <Button onClick={() => navigate(`/projects/${board.projectId}/backlog`)} className="btn-neon">
              <Rocket className="w-4 h-4 mr-2" />
              Go to Backlog
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main board ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in p-6 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${board.projectId}`)} className="hover:bg-cyan-500/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white tracking-tight">
                  <span className="text-gradient-animate">Sprint Board</span>
                </h1>
                <div
                  className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border"
                  style={{ backgroundColor: `${BOARD_THEME.cyan}15`, borderColor: `${BOARD_THEME.cyan}30`, color: BOARD_THEME.cyan }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {board.activeSprint.name}
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">{board.currentProject?.name}</p>
            </div>
          </div>
          <Button onClick={board.openCreateModal} className="btn-neon gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Create Issue
          </Button>
        </div>

        {/* Stats */}
        <BoardStatsBar {...board.stats} />

        {/* Filters */}
        <div className="flex items-center gap-4 p-3 glass-card rounded-xl border border-slate-700/30">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search issues..."
              value={board.searchQuery}
              onChange={(e) => board.setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <div className="h-6 w-px bg-slate-700/50" />
          <button
            onClick={board.toggleUserFilter}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              board.userFilter === 'mine'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50',
            )}
          >
            <User className="w-4 h-4" />
            My Issues
          </button>
          {board.hasActiveFilters && (
            <button
              onClick={board.clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={board.handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {(Object.keys(STATUS_CONFIG) as BoardStatus[]).map((status) => (
            <BoardColumn
              key={status}
              status={status}
              issues={board.columns[status]}
              onIssueClick={board.setSelectedIssue}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Issue Detail Modal */}
      {board.selectedIssue && (
        <IssueDetailModal
          issue={board.selectedIssue}
          onClose={() => board.setSelectedIssue(null)}
          onUpdate={() => board.fetchIssues(board.projectId!)}
        />
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={board.showCreateModal}
        onClose={board.closeCreateModal}
        formData={board.formData}
        onChange={board.setFormData}
        onSubmit={board.handleCreateIssue}
        error={board.formError}
      />
    </div>
  )
}
