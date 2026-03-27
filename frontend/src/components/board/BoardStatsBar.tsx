import { Layers, Zap, CheckCircle2, Target } from 'lucide-react'
import { BOARD_THEME } from '@/constants/board'

interface BoardStatsBarProps {
  total: number
  inProgress: number
  done: number
  totalPoints: number
  completedPoints: number
  progress: number
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-card">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold text-white">{value}</p>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
}

export function BoardStatsBar({ total, inProgress, done, totalPoints, completedPoints, progress }: BoardStatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <StatCard label="Total Issues" value={total} icon={Layers} color={BOARD_THEME.cyan} />
      <StatCard label="In Progress" value={inProgress} icon={Zap} color={BOARD_THEME.blue} />
      <StatCard label="Done" value={done} icon={CheckCircle2} color={BOARD_THEME.emerald} />
      <StatCard label="Points" value={`${completedPoints}/${totalPoints}`} icon={Target} color={BOARD_THEME.purple} />

      {/* Progress Bar */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Sprint Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${BOARD_THEME.emerald} 0%, ${BOARD_THEME.cyan} 100%)`,
              boxShadow: `0 0 20px ${BOARD_THEME.emerald}50`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
