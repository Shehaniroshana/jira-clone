import { CheckCircle2, Zap, Clock, Target } from 'lucide-react'

export const BOARD_THEME = {
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
} as const

export const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: '#64748b',
    gradient: 'from-slate-500/20 to-slate-600/10',
    icon: Target,
    glow: 'rgba(100, 116, 139, 0.3)',
  },
  in_progress: {
    label: 'In Progress',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-blue-600/10',
    icon: Zap,
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  in_review: {
    label: 'In Review',
    color: '#8b5cf6',
    gradient: 'from-purple-500/20 to-purple-600/10',
    icon: Clock,
    glow: 'rgba(139, 92, 246, 0.3)',
  },
  done: {
    label: 'Done',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    icon: CheckCircle2,
    glow: 'rgba(16, 185, 129, 0.3)',
  },
} as const

export type BoardStatus = keyof typeof STATUS_CONFIG
