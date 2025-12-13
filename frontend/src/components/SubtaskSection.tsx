import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Plus, CheckCircle2, Circle, Clock, Trash2, 
    ChevronRight,
    ListChecks, AlertCircle, Loader2
} from 'lucide-react'
import { subtaskService } from '@/services/subtaskService'
import type { Issue, CreateSubtaskInput, SubtaskProgress, User as UserType } from '@/types'
import { userService } from '@/services/userService'

interface SubtaskSectionProps {
    issueId: string
    onSubtaskChange?: () => void
}

const statusColors = {
    todo: { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: Circle },
    in_progress: { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-900/50', icon: Clock },
    in_review: { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-900/50', icon: AlertCircle },
    done: { bg: 'bg-emerald-900/20', text: 'text-emerald-400', border: 'border-emerald-900/50', icon: CheckCircle2 },
}

const priorityColors = {
    lowest: 'bg-slate-800 text-slate-500',
    low: 'bg-blue-900/20 text-blue-400',
    medium: 'bg-amber-900/20 text-amber-500',
    high: 'bg-orange-900/20 text-orange-500',
    highest: 'bg-red-900/20 text-red-500',
}

export default function SubtaskSection({ issueId, onSubtaskChange }: SubtaskSectionProps) {
    const [subtasks, setSubtasks] = useState<Issue[]>([])
    const [progress, setProgress] = useState<SubtaskProgress | null>(null)
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [users, setUsers] = useState<UserType[]>([])
    const [newSubtask, setNewSubtask] = useState<CreateSubtaskInput>({
        title: '',
        description: '',
        priority: 'medium',
    })
    const [submitting, setSubmitting] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    useEffect(() => {
        fetchSubtasks()
        fetchUsers()
    }, [issueId])

    const fetchSubtasks = async () => {
        try {
            setLoading(true)
            const [subtasksData, progressData] = await Promise.all([
                subtaskService.getSubtasks(issueId),
                subtaskService.getSubtaskProgress(issueId),
            ])
            setSubtasks(subtasksData)
            setProgress(progressData)
        } catch (error) {
            console.error('Failed to fetch subtasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const usersData = await userService.getAll()
            setUsers(usersData)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        }
    }

    const handleCreateSubtask = async () => {
        if (!newSubtask.title.trim()) return

        try {
            setSubmitting(true)
            const subtask = await subtaskService.createSubtask(issueId, newSubtask)
            setSubtasks([...subtasks, subtask])
            setNewSubtask({ title: '', description: '', priority: 'medium' })
            setShowAddForm(false)
            fetchSubtasks() // Refresh progress
            onSubtaskChange?.()
        } catch (error) {
            console.error('Failed to create subtask:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleStatusChange = async (subtaskId: string, status: string) => {
        try {
            setUpdatingId(subtaskId)
            await subtaskService.updateSubtaskStatus(subtaskId, status)
            setSubtasks(subtasks.map(s => s.id === subtaskId ? { ...s, status: status as Issue['status'] } : s))
            fetchSubtasks() // Refresh progress
            onSubtaskChange?.()
        } catch (error) {
            console.error('Failed to update subtask status:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDeleteSubtask = async (subtaskId: string) => {
        try {
            await subtaskService.deleteSubtask(subtaskId)
            setSubtasks(subtasks.filter(s => s.id !== subtaskId))
            fetchSubtasks() // Refresh progress
            onSubtaskChange?.()
        } catch (error) {
            console.error('Failed to delete subtask:', error)
        }
    }

    const toggleComplete = async (subtask: Issue) => {
        const newStatus = subtask.status === 'done' ? 'todo' : 'done'
        await handleStatusChange(subtask.id, newStatus)
    }

    return (
        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <ListChecks className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-white">Subtasks</h3>
                        {progress && (
                            <p className="text-sm text-slate-400">
                                {progress.completed}/{progress.total} completed
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {progress && progress.total > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress.percentage}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                            <span className="text-sm font-medium text-slate-400">{progress.percentage}%</span>
                        </div>
                    )}
                    <motion.div
                        animate={{ rotate: expanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                    </motion.div>
                </div>
            </button>

            {/* Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                    >
                        <div className="p-5 space-y-3">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                                            <div className="w-5 h-5 rounded-full bg-slate-700 animate-pulse" />
                                            <div className="flex-1 h-4 rounded bg-slate-700 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    {/* Subtask List */}
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {subtasks.map((subtask, index) => {
                                                const isUpdating = updatingId === subtask.id
                                                
                                                return (
                                                    <motion.div
                                                        key={subtask.id}
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                            subtask.status === 'done'
                                                                ? 'bg-emerald-900/10 border-emerald-900/30'
                                                                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <button
                                                            onClick={() => toggleComplete(subtask)}
                                                            disabled={isUpdating}
                                                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                subtask.status === 'done'
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                                                    : 'border-slate-500 hover:border-emerald-400 bg-transparent'
                                                            }`}
                                                        >
                                                            {isUpdating ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : subtask.status === 'done' ? (
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            ) : null}
                                                        </button>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium truncate transition-colors ${
                                                                subtask.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'
                                                            }`}>
                                                                {subtask.title}
                                                            </p>
                                                            {subtask.description && (
                                                                <p className="text-sm text-slate-500 truncate">{subtask.description}</p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* Priority Badge */}
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                                priorityColors[subtask.priority]
                                                            }`}>
                                                                {subtask.priority}
                                                            </span>

                                                            {/* Assignee */}
                                                            {subtask.assignee && (
                                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium shadow-sm ring-1 ring-white/10">
                                                                    {subtask.assignee.avatar ? (
                                                                        <img src={subtask.assignee.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                                    ) : (
                                                                        subtask.assignee.firstName[0]
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Status Dropdown */}
                                                            <select
                                                                value={subtask.status}
                                                                onChange={(e) => handleStatusChange(subtask.id, e.target.value)}
                                                                disabled={isUpdating}
                                                                className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                                                                    statusColors[subtask.status]?.bg
                                                                } ${statusColors[subtask.status]?.text} ${statusColors[subtask.status]?.border}`}
                                                            >
                                                                <option value="todo" className="bg-slate-900 text-white">To Do</option>
                                                                <option value="in_progress" className="bg-slate-900 text-white">In Progress</option>
                                                                <option value="in_review" className="bg-slate-900 text-white">In Review</option>
                                                                <option value="done" className="bg-slate-900 text-white">Done</option>
                                                            </select>

                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </AnimatePresence>
                                    </div>

                                    {subtasks.length === 0 && !showAddForm && (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-slate-700/50">
                                                <ListChecks className="w-8 h-8 text-slate-600" />
                                            </div>
                                            <p className="text-slate-500 mb-4">No subtasks yet</p>
                                            <button
                                                onClick={() => setShowAddForm(true)}
                                                className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
                                            >
                                                Add your first subtask
                                            </button>
                                        </div>
                                    )}

                                    {/* Add Subtask Form */}
                                    <AnimatePresence>
                                        {showAddForm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-blue-900/10 rounded-xl p-4 border border-blue-500/20"
                                            >
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={newSubtask.title}
                                                        onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                                                        placeholder="Subtask title..."
                                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder:text-slate-600"
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="text"
                                                        value={newSubtask.description || ''}
                                                        onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                                                        placeholder="Description (optional)..."
                                                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white placeholder:text-slate-600"
                                                    />
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={newSubtask.priority}
                                                            onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value as CreateSubtaskInput['priority'] })}
                                                            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                                                        >
                                                            <option value="lowest">Lowest</option>
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="highest">Highest</option>
                                                        </select>
                                                        <select
                                                            value={newSubtask.assigneeId || ''}
                                                            onChange={(e) => setNewSubtask({ ...newSubtask, assigneeId: e.target.value || undefined })}
                                                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {users.map(user => (
                                                                <option key={user.id} value={user.id}>
                                                                    {user.firstName} {user.lastName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setShowAddForm(false)
                                                                setNewSubtask({ title: '', description: '', priority: 'medium' })
                                                            }}
                                                            className="px-4 py-2 text-slate-400 font-medium rounded-xl hover:bg-slate-800 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={handleCreateSubtask}
                                                            disabled={!newSubtask.title.trim() || submitting}
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {submitting ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Creating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Subtask
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Add Button */}
                                    {!showAddForm && subtasks.length > 0 && (
                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => setShowAddForm(true)}
                                            className="w-full p-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Add Subtask
                                        </motion.button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
