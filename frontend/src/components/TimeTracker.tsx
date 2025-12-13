import { useState, useEffect } from 'react'
import { Clock, Plus, Timer, TrendingUp, Calendar, Play, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { workLogService } from '@/services/workLogService'
import { useToast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'
import type { WorkLog } from '@/types'

interface TimeTrackerProps {
    issueId: string
    estimatedTime?: number
    timeSpent?: number
    onUpdate?: () => void
}

export default function TimeTracker({ issueId, estimatedTime = 0, timeSpent = 0, onUpdate }: TimeTrackerProps) {
    const [showLogForm, setShowLogForm] = useState(false)
    const [showEstimateForm, setShowEstimateForm] = useState(false)
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
    const [hours, setHours] = useState('')
    const [description, setDescription] = useState('')
    const [estimateHours, setEstimateHours] = useState((estimatedTime / 60).toString())
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        loadWorkLogs()
    }, [issueId])

    const loadWorkLogs = async () => {
        try {
            const logs = await workLogService.getByIssue(issueId)
            setWorkLogs(logs)
        } catch (error) {
            console.error('Failed to load work logs:', error)
        }
    }

    const handleLogTime = async () => {
        if (!hours || parseFloat(hours) <= 0) {
            toast({
                title: 'Invalid Input',
                description: 'Please enter valid hours',
            })
            return
        }

        setIsLoading(true)
        try {
            const minutes = Math.round(parseFloat(hours) * 60)
            await workLogService.create({
                issueId,
                timeSpent: minutes,
                description: description || '',
            })

            toast({
                title: 'Time Logged! ⏱️',
                description: `${hours} hours logged successfully`,
            })

            setShowLogForm(false)
            setHours('')
            setDescription('')
            await loadWorkLogs()
            onUpdate?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to log time',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateEstimate = async () => {
        if (!estimateHours || parseFloat(estimateHours) < 0) {
            toast({
                title: 'Invalid Input',
                description: 'Please enter a valid estimate',
            })
            return
        }

        setIsLoading(true)
        try {
            const minutes = Math.round(parseFloat(estimateHours) * 60)
            await workLogService.updateEstimate(issueId, minutes)

            toast({
                title: 'Estimate Updated! 🎯',
                description: `Set to ${estimateHours} hours`,
            })

            setShowEstimateForm(false)
            onUpdate?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to update estimate',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteLog = async (logId: string) => {
        if (!confirm('Delete this time log?')) return

        try {
            await workLogService.delete(logId)
            toast({
                title: 'Deleted',
                description: 'Time log removed',
            })
            await loadWorkLogs()
            onUpdate?.()
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to delete log',
            })
        }
    }

    const formatTime = (minutes: number) => {
        const hrs = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hrs === 0) return `${mins}m`
        if (mins === 0) return `${hrs}h`
        return `${hrs}h ${mins}m`
    }

    const remaining = estimatedTime - timeSpent
    const progress = estimatedTime > 0 ? Math.min((timeSpent / estimatedTime) * 100, 100) : 0
    const isOvertime = remaining < 0

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Timer className="w-4 h-4 text-cyan-400" />
                    Time Tracking
                </h3>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEstimateForm(!showEstimateForm)}
                        className="h-7 px-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30"
                    >
                        <Target className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLogForm(!showLogForm)}
                        className="h-7 px-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Estimate Form */}
            {showEstimateForm && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-3 animate-fade-in">
                    <label className="text-sm font-medium text-cyan-400">
                        Set Time Estimate (hours)
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="0"
                            value={estimateHours}
                            onChange={(e) => setEstimateHours(e.target.value)}
                            step="0.5"
                            min="0"
                            className="flex-1 bg-slate-900 border-slate-700 text-white"
                        />
                        <Button 
                            onClick={handleUpdateEstimate} 
                            disabled={isLoading}
                            size="sm"
                            className="bg-cyan-600 hover:bg-cyan-500"
                        >
                            Save
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowEstimateForm(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Time Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                    <div className="flex items-center justify-center mb-1">
                        <Target className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 mb-1">Estimate</p>
                    <p className="text-lg font-bold text-white">
                        {estimatedTime > 0 ? formatTime(estimatedTime) : '—'}
                    </p>
                </div>
                
                <div className="p-3 bg-cyan-950/20 border border-cyan-900/50 rounded-xl text-center">
                    <div className="flex items-center justify-center mb-1">
                        <Clock className="w-4 h-4 text-cyan-500" />
                    </div>
                    <p className="text-xs text-cyan-400 mb-1">Logged</p>
                    <p className="text-lg font-bold text-cyan-300">
                        {formatTime(timeSpent)}
                    </p>
                </div>
                
                <div className={`p-3 rounded-xl text-center border ${
                    isOvertime 
                        ? 'bg-red-950/20 border-red-900/50' 
                        : 'bg-emerald-950/20 border-emerald-900/50'
                }`}>
                    <div className="flex items-center justify-center mb-1">
                        <TrendingUp className={`w-4 h-4 ${isOvertime ? 'text-red-500' : 'text-emerald-500'}`} />
                    </div>
                    <p className={`text-xs mb-1 ${isOvertime ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isOvertime ? 'Overtime' : 'Remaining'}
                    </p>
                    <p className={`text-lg font-bold ${
                        isOvertime 
                            ? 'text-red-300' 
                            : 'text-emerald-300'
                    }`}>
                        {isOvertime ? '+' : ''}{formatTime(Math.abs(remaining))}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            {estimatedTime > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Progress</span>
                        <span className={`font-medium ${isOvertime ? 'text-red-400' : 'text-cyan-400'}`}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 relative ${
                                isOvertime 
                                    ? 'bg-gradient-to-r from-red-600 to-red-400' 
                                    : 'bg-gradient-to-r from-cyan-600 to-emerald-400'
                            }`}
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                        </div>
                    </div>
                </div>
            )}

            {/* Log Time Button */}
            <Button
                onClick={() => setShowLogForm(!showLogForm)}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                size="sm"
            >
                <Play className="w-4 h-4 mr-2" />
                Log Time
            </Button>

            {/* Log Time Form */}
            {showLogForm && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-4 animate-fade-in">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Hours Spent</label>
                        <Input
                            type="number"
                            placeholder="e.g., 2.5"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            step="0.25"
                            min="0.25"
                            className="bg-slate-900 border-slate-700 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Description (optional)</label>
                        <Input
                            placeholder="What did you work on?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={handleLogTime} 
                            className="flex-1 btn-neon" 
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging...' : 'Log Time'}
                        </Button>
                        <Button 
                            onClick={() => setShowLogForm(false)} 
                            variant="outline"
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Work Logs List */}
            {workLogs.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Work Logs
                        </h4>
                        <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                            {workLogs.length}
                        </Badge>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {workLogs.map((log, index) => (
                            <div
                                key={log.id}
                                className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:bg-slate-800/50 transition-all group animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-bold">
                                        {log.user ? getInitials(log.user.firstName, log.user.lastName) : '??'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50 border-0">
                                            {formatTime(log.timeSpent)}
                                        </Badge>
                                        <span className="text-xs text-slate-500">
                                            by {log.user?.firstName}
                                        </span>
                                    </div>
                                    {log.description && (
                                        <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                                            {log.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(log.loggedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
