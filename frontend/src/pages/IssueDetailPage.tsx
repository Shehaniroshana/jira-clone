import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { issueService } from '@/services/issueService'
import { useToast } from '@/hooks/use-toast'
import type { Issue } from '@/types'
import { ISSUE_TYPES, PRIORITIES, STATUSES } from '@/lib/constants'
import CommentSection from '@/components/CommentSection'
import SubtaskSection from '@/components/SubtaskSection'
import TimeTracker from '@/components/TimeTracker'
import ActivityTimeline from '@/components/ActivityTimeline'
import LinkedIssuesSection from '@/components/LinkedIssuesSection'
import LabelManager from '@/components/LabelManager'
import UserSelector from '@/components/UserSelector'

export default function IssueDetailPage() {
    const { projectId, issueId } = useParams()
    const navigate = useNavigate()
    const { toast } = useToast()
    const [issue, setIssue] = useState<Issue | null>(null)
    const [loading, setLoading] = useState(true)
    const [comments, setComments] = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])

    // Editing state
    const [editing, setEditing] = useState<{ [key: string]: boolean }>({})
    const [editValues, setEditValues] = useState<any>({})

    useEffect(() => {
        if (issueId) {
            fetchIssueDetails()
            fetchComments()
            fetchActivities()
        }
    }, [issueId])

    const fetchIssueDetails = async () => {
        if (!issueId) return
        try {
            setLoading(true)
            const data = await issueService.getById(issueId)
            setIssue(data)
            setEditValues({
                title: data.title,
                description: data.description || "",
                type: data.type,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId,
                storyPoints: data.storyPoints,
            })
        } catch (error) {
            console.error("Failed to fetch issue:", error)
            toast({ title: "Error", description: "Failed to load issue", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const fetchComments = async () => {
        if (!issueId) return
        try {
            const data = await issueService.getComments(issueId)
            setComments(data)
        } catch (error) {
            console.error("Failed to fetch comments:", error)
        }
    }

    const fetchActivities = async () => {
        if (!issueId) return
        try {
            const data = await issueService.getActivities(issueId)
            setActivities(data)
        } catch (error) {
            console.error("Failed to fetch activities:", error)
        }
    }

    const handleUpdate = async (field: string, value: any) => {
        if (!issue) return
        try {
            const updateData = { ...editValues, [field]: value, sprintId: issue.sprintId }
            await issueService.update(issue.id, updateData)
            await fetchIssueDetails()
            setEditing({ ...editing, [field]: false })
            toast({ title: "Updated", description: `${field} updated successfully` })
        } catch (error) {
            console.error("Failed to update:", error)
            toast({ title: "Error", description: "Update failed", variant: "destructive" })
        }
    }

    const handleDelete = async () => {
        if (!issue || !confirm("Are you sure you want to delete this issue?")) return
        try {
            await issueService.delete(issue.id)
            toast({ title: "Deleted", description: "Issue deleted successfully" })
            navigate(`/projects/${projectId}/backlog`)
        } catch (error) {
            console.error("Failed to delete:", error)
            toast({ title: "Error", description: "Delete failed", variant: "destructive" })
        }
    }

    if (loading) return <div className="p-8 text-center text-slate-400">Loading issue details...</div>
    if (!issue) return <div className="p-8 text-center text-slate-400">Issue not found</div>

    const getTypeColor = (type: string) => ISSUE_TYPES.find((t) => t.id === type)?.color || "bg-slate-600"
    const getTypeIcon = (type: string) => {
        const Icon = ISSUE_TYPES.find((t) => t.id === type)?.icon
        return Icon ? <Icon className="w-4 h-4" /> : null
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-6 pb-20">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to={`/projects/${projectId}/board`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Board
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-700/50" />
                    <span className="text-slate-500 font-mono text-sm">{issue.key}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Issue
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Details) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Title */}
                    <div>
                        {editing.title ? (
                            <input
                                autoFocus
                                className="w-full text-3xl font-bold bg-slate-900/50 border-b-2 border-cyan-500 text-white focus:outline-none py-2 px-1"
                                value={editValues.title}
                                onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                onBlur={() => handleUpdate("title", editValues.title)}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdate("title", editValues.title)}
                            />
                        ) : (
                            <h1
                                className="text-3xl font-bold text-white hover:text-cyan-400 cursor-pointer transition-colors"
                                onClick={() => setEditing({ ...editing, title: true })}
                            >
                                {issue.title}
                            </h1>
                        )}
                    </div>

                    {/* Description */}
                    <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <FileText className="w-5 h-5" />
                            <h3 className="font-semibold">Description</h3>
                        </div>
                        {editing.description ? (
                            <textarea
                                autoFocus
                                className="w-full min-h-[200px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-y"
                                value={editValues.description}
                                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                onBlur={() => handleUpdate("description", editValues.description)}
                            />
                        ) : (
                            <div
                                className="prose prose-invert max-w-none text-slate-300 cursor-pointer hover:bg-slate-800/30 p-4 rounded-xl transition-colors min-h-[100px]"
                                onClick={() => setEditing({ ...editing, description: true })}
                            >
                                {issue.description || <span className="text-slate-500 italic">No description provided. Click to add one...</span>}
                            </div>
                        )}
                    </div>

                    {/* Tabs Section */}
                    <Tabs defaultValue="activity" className="w-full">
                        <TabsList className="glass-card border border-slate-700/50 bg-slate-900/50 p-1">
                            <TabsTrigger value="activity">Activity</TabsTrigger>
                            <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
                            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
                            <TabsTrigger value="linked">Linked</TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            <TabsContent value="activity">
                                <ActivityTimeline activities={activities} />
                            </TabsContent>
                            <TabsContent value="comments">
                                <CommentSection issueId={issue.id} comments={comments} onCommentAdded={fetchComments} />
                            </TabsContent>
                            <TabsContent value="subtasks">
                                <SubtaskSection issueId={issue.id} onSubtaskChange={fetchIssueDetails} />
                            </TabsContent>
                            <TabsContent value="linked">
                                <LinkedIssuesSection issueId={issue.id} projectId={projectId!} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Status & Type Card */}
                    <div className="glass-card p-5 rounded-xl border border-slate-700/50 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Status</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                                value={editValues.status}
                                onChange={(e) => {
                                    setEditValues({ ...editValues, status: e.target.value })
                                    handleUpdate("status", e.target.value)
                                }}
                            >
                                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Type</label>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 ${getTypeColor(issue.type)} bg-opacity-10 text-white capitalize`}>
                                    {getTypeIcon(issue.type)}
                                    <span>{issue.type}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-500">Priority</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none capitalize"
                                    value={editValues.priority}
                                    onChange={(e) => {
                                        setEditValues({ ...editValues, priority: e.target.value })
                                        handleUpdate("priority", e.target.value)
                                    }}
                                >
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* People Card */}
                    <div className="glass-card p-5 rounded-xl border border-slate-700/50 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">People</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Assignee</label>
                            <UserSelector
                                selectedUserId={editValues.assigneeId}
                                onSelect={(id) => {
                                    setEditValues({ ...editValues, assigneeId: id })
                                    handleUpdate("assigneeId", id)
                                }}
                            />
                        </div>

                        <div className="pt-2">
                            <label className="text-xs text-slate-500 block mb-1">Reporter</label>
                            <div className="flex items-center gap-2 text-sm text-white bg-slate-900 p-2 rounded-lg border border-slate-700">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs text-cyan-400 font-bold">
                                    {issue.reporter?.firstName?.[0]}
                                </div>
                                {issue.reporter?.firstName} {issue.reporter?.lastName}
                            </div>
                        </div>
                    </div>

                    {/* Planning Card */}
                    <div className="glass-card p-5 rounded-xl border border-slate-700/50 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Planning</h3>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Story Points</label>
                            <input
                                type="number"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                                value={editValues.storyPoints || ''}
                                onChange={(e) => setEditValues({ ...editValues, storyPoints: e.target.value ? parseInt(e.target.value) : undefined })}
                                onBlur={() => handleUpdate("storyPoints", editValues.storyPoints)}
                            />
                        </div>

                        <div className="space-y-1 pt-2">
                            <label className="text-xs text-slate-500">Labels</label>
                            <LabelManager
                                issueId={issue.id}
                                projectId={projectId!}
                                selectedLabels={issue.labels || []}
                                onUpdate={fetchIssueDetails}
                            />
                        </div>
                    </div>

                    {/* Time Tracking */}
                    <div className="glass-card p-5 rounded-xl border border-slate-700/50">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Tracking</h3>
                        <TimeTracker issueId={issue.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
