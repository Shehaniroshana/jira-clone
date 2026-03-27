import { BookOpen, CheckCircle2, Bug, Layers } from 'lucide-react'

export const ISSUE_TYPES = [
  { id: 'story', label: 'Story', icon: BookOpen, color: '#10b981', bg: 'bg-emerald-500/20', textColor: 'text-green-400' },
  { id: 'task', label: 'Task', icon: CheckCircle2, color: '#3b82f6', bg: 'bg-blue-500/20', textColor: 'text-blue-400' },
  { id: 'bug', label: 'Bug', icon: Bug, color: '#f43f5e', bg: 'bg-rose-500/20', textColor: 'text-red-400' },
  { id: 'epic', label: 'Epic', icon: Layers, color: '#8b5cf6', bg: 'bg-purple-500/20', textColor: 'text-purple-400' },
] as const

export type IssueTypeId = typeof ISSUE_TYPES[number]['id']

export const PRIORITY_CONFIG: Record<string, { color: string; glow: string; label: string; dotClass: string }> = {
  highest: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.6)',
    label: 'Highest',
    dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  },
  high: {
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.5)',
    label: 'High',
    dotClass: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
  },
  medium: {
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    label: 'Medium',
    dotClass: 'bg-amber-500',
  },
  low: {
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    label: 'Low',
    dotClass: 'bg-cyan-400',
  },
  lowest: {
    color: '#64748b',
    glow: 'rgba(100, 116, 139, 0.3)',
    label: 'Lowest',
    dotClass: 'bg-slate-400',
  },
}

/** Returns the type config for a given issue type id, falling back to 'task'. */
export function getIssueTypeConfig(type: string) {
  return ISSUE_TYPES.find((t) => t.id === type) ?? ISSUE_TYPES[1]
}

/** Returns the Tailwind dot class for a given priority. */
export function getPriorityDotClass(priority: string): string {
  return PRIORITY_CONFIG[priority]?.dotClass ?? 'bg-slate-400'
}
