import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, Edit, Trash, MessageSquare, GitBranch, ArrowRight } from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { ActivityLog } from '@/types'

interface ActivityTimelineProps {
  activities: ActivityLog[]
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <GitBranch className="w-3.5 h-3.5" />
      case 'updated':
        return <Edit className="w-3.5 h-3.5" />
      case 'deleted':
        return <Trash className="w-3.5 h-3.5" />
      case 'commented':
        return <MessageSquare className="w-3.5 h-3.5" />
      default:
        return <Clock className="w-3.5 h-3.5" />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
      case 'updated':
        return 'text-blue-400 bg-blue-950/30 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
      case 'deleted':
        return 'text-red-400 bg-red-950/30 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
      case 'commented':
        return 'text-purple-400 bg-purple-950/30 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
      default:
        return 'text-slate-400 bg-slate-800/50 border-slate-700/50'
    }
  }

  const parseChanges = (changesJson: string) => {
    try {
      return JSON.parse(changesJson)
    } catch {
      return null
    }
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20">
        <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <div className="text-slate-500 font-medium">No activity yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Timeline Line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-slate-800" />

      {activities.map((activity, index) => {
        const changes = activity.changes ? parseChanges(activity.changes) : null

        return (
          <div key={activity.id} className="relative flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            {/* User Avatar - Timeline Point */}
            <div className="relative z-10 flex-shrink-0">
              <Avatar className="w-10 h-10 ring-4 ring-slate-900 border border-slate-700 bg-slate-800">
                <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-[10px] font-bold">
                  {activity.user ? getInitials(activity.user.firstName, activity.user.lastName) : '??'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Content Card */}
            <div className="flex-1 min-w-0">
               <div className="glass-card p-4 rounded-xl border border-slate-700/50 hover:border-slate-500/50 transition-colors group">
                <div className="flex flex-wrap items-start justify-between gap-y-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">
                      {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown'}
                    </span>
                    <Badge className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${getActivityColor(activity.action)}`}>
                      <span className="mr-1.5">{getActivityIcon(activity.action)}</span>
                      {activity.action}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-slate-300">
                  <span className="text-slate-500 uppercase text-xs font-bold mr-2">{activity.entityType}</span>
                  {activity.action}
                </p>

                {changes && (changes.old || changes.new) && (
                  <div className="mt-3 bg-slate-950/50 rounded-lg p-3 border border-slate-800 space-y-2 text-xs font-mono">
                    {/* Handle simple value changes */}
                    {typeof changes.old !== 'object' && typeof changes.new !== 'object' ? (
                       <div className="flex items-center gap-2 overflow-x-auto">
                          <span className="text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/30 line-through opacity-70">
                            {String(changes.old)}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                            {String(changes.new)}
                          </span>
                       </div>
                    ) : (
                      // Handle object/field changes
                      Object.keys(changes.new || {}).map((key) => {
                         const oldVal = changes.old ? changes.old[key] : undefined
                         const newVal = changes.new[key]
                         
                         if (oldVal !== newVal) {
                           return (
                            <div key={key} className="flex items-center gap-2 overflow-x-auto pb-1">
                               <span className="text-slate-500 font-semibold">{key}:</span>
                               {oldVal !== undefined && (
                                 <span className="text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded border border-red-900/30 line-through opacity-70 whitespace-nowrap">
                                   {String(oldVal)}
                                 </span>
                               )}
                               <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                               <span className="text-emerald-400 bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30 whitespace-nowrap">
                                 {String(newVal)}
                               </span>
                            </div>
                           )
                         }
                         return null
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
