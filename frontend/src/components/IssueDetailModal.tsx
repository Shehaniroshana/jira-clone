import { useState, useEffect } from "react";
import {
    X,
    User,
    Tag,
    Clock,
    FileText,
    MessageSquare,
    Link as LinkIcon,
    Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Issue } from "@/types";
import { issueService } from "@/services/issueService";
import CommentSection from "@/components/CommentSection";
import SubtaskSection from "@/components/SubtaskSection";
import TimeTracker from "@/components/TimeTracker";
import ActivityTimeline from "@/components/ActivityTimeline";
import LinkedIssuesSection from "@/components/LinkedIssuesSection";
import LabelManager from "@/components/LabelManager";
import UserSelector from "@/components/UserSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ISSUE_TYPES, PRIORITIES, STATUSES } from "@/lib/constants";

interface IssueDetailModalProps {
    issue: Issue;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function IssueDetailModal({
    issue: initialIssue,
    onClose,
    onUpdate,
}: IssueDetailModalProps) {
    const [issue, setIssue] = useState(initialIssue);
    const [editing, setEditing] = useState<{ [key: string]: boolean }>({});
    const [editValues, setEditValues] = useState({
        title: issue.title,
        description: issue.description || "",
        type: issue.type,
        status: issue.status,
        priority: issue.priority,
        assigneeId: issue.assigneeId,
        storyPoints: issue.storyPoints,
    });
    const [comments, setComments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchIssueDetails();
        fetchComments();
        fetchActivities();
    }, [issue.id]);

    const fetchIssueDetails = async () => {
        try {
            const data = await issueService.getById(issue.id);
            setIssue(data);
            setEditValues({
                title: data.title,
                description: data.description || "",
                type: data.type,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId,
                storyPoints: data.storyPoints,
            });
        } catch (error) {
            console.error("Failed to fetch issue:", error);
        }
    };

    const fetchComments = async () => {
        try {
            const data = await issueService.getComments(issue.id);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            setComments([]);
        }
    };

    const fetchActivities = async () => {
        try {
            const data = await issueService.getActivities(issue.id);
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activities:", error);
            setActivities([]);
        }
    };

    const handleUpdate = async (field: string, value: any) => {
        try {
            const updateData = {
                title: editValues.title,
                description: editValues.description,
                type: editValues.type,
                status: editValues.status,
                priority: editValues.priority,
                assigneeId: editValues.assigneeId,
                sprintId: issue.sprintId,
                storyPoints: editValues.storyPoints,
                [field]: value,
            };

            await issueService.update(issue.id, updateData);
            await fetchIssueDetails();
            setEditing({ ...editing, [field]: false });
            onUpdate?.();

            toast({
                title: "Issue Updated",
                description: `${field} has been updated successfully`,
            });
        } catch (error) {
            console.error("Failed to update issue:", error);
            toast({
                title: "Error",
                description: "Failed to update issue",
                variant: "destructive",
            });
        }
    };

    const getTypeIcon = (type: string) => {
        const typeConfig = ISSUE_TYPES.find((t) => t.id === type);
        if (!typeConfig) return null;
        const Icon = typeConfig.icon;
        return <Icon className="w-4 h-4" />;
    };

    const getTypeColor = (type: string) => {
        const typeConfig = ISSUE_TYPES.find((t) => t.id === type);
        return typeConfig?.color || "bg-slate-600";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            highest: "bg-red-500",
            high: "bg-orange-500",
            medium: "bg-amber-500",
            low: "bg-cyan-400",
            lowest: "bg-slate-400",
        };
        return colors[priority] || "bg-slate-400";
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            todo: "bg-slate-700 text-slate-300",
            in_progress: "bg-blue-500/20 text-blue-400",
            in_review: "bg-purple-500/20 text-purple-400",
            done: "bg-emerald-500/20 text-emerald-400",
        };
        return colors[status] || "bg-slate-700 text-slate-300";
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-6xl glass-card rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex-none flex items-center justify-between p-6 border-b border-slate-700/50">
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`p-2 rounded-xl ${getTypeColor(issue.type)}`}>
                                {getTypeIcon(issue.type)}
                            </div>
                            <div className="flex-1">
                                {editing.title ? (
                                    <input
                                        type="text"
                                        value={editValues.title}
                                        onChange={(e) =>
                                            setEditValues({ ...editValues, title: e.target.value })
                                        }
                                        onBlur={() => handleUpdate("title", editValues.title)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                handleUpdate("title", editValues.title);
                                            if (e.key === "Escape")
                                                setEditing({ ...editing, title: false });
                                        }}
                                        className="text-2xl font-bold text-white bg-transparent border-b-2 border-cyan-500 focus:outline-none w-full"
                                        autoFocus
                                    />
                                ) : (
                                    <h2
                                        className="text-2xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors"
                                        onClick={() => setEditing({ ...editing, title: true })}
                                    >
                                        {issue.title}
                                    </h2>
                                )}
                                <p className="text-sm text-slate-400 mt-1">{issue.key}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Description */}
                                <div className="glass-card rounded-xl p-5 border border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <h3 className="font-semibold text-white">Description</h3>
                                    </div>
                                    {editing.description ? (
                                        <textarea
                                            value={editValues.description}
                                            onChange={(e) =>
                                                setEditValues({
                                                    ...editValues,
                                                    description: e.target.value,
                                                })
                                            }
                                            onBlur={() =>
                                                handleUpdate("description", editValues.description)
                                            }
                                            className="w-full min-h-[150px] bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="text-slate-300 cursor-pointer hover:bg-slate-800/50 rounded-lg p-3 transition-colors min-h-[100px]"
                                            onClick={() =>
                                                setEditing({ ...editing, description: true })
                                            }
                                        >
                                            {issue.description || (
                                                <span className="text-slate-500 italic">
                                                    Click to add a description...
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Tabs */}
                                <Tabs defaultValue="subtasks" className="w-full">
                                    <TabsList className="glass-card border border-slate-700/50">
                                        <TabsTrigger
                                            value="subtasks"
                                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                                        >
                                            Subtasks
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="comments"
                                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Comments
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="activity"
                                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                                        >
                                            <Activity className="w-4 h-4 mr-2" />
                                            Activity
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="linked"
                                            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                                        >
                                            <LinkIcon className="w-4 h-4 mr-2" />
                                            Linked Issues
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="subtasks" className="mt-4">
                                        <SubtaskSection
                                            issueId={issue.id}
                                            onSubtaskChange={fetchIssueDetails}
                                        />
                                    </TabsContent>

                                    <TabsContent value="comments" className="mt-4">
                                        <CommentSection
                                            issueId={issue.id}
                                            comments={comments}
                                            onCommentAdded={fetchComments}
                                        />
                                    </TabsContent>

                                    <TabsContent value="activity" className="mt-4">
                                        <ActivityTimeline activities={activities} />
                                    </TabsContent>

                                    <TabsContent value="linked" className="mt-4">
                                        <LinkedIssuesSection
                                            issueId={issue.id}
                                            projectId={issue.projectId}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Status */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-400 mb-2 block">
                                        Status
                                    </label>
                                    <select
                                        value={editValues.status}
                                        onChange={(e) => {
                                            setEditValues({
                                                ...editValues,
                                                status: e.target.value as any,
                                            });
                                            handleUpdate("status", e.target.value);
                                        }}
                                        className={`w-full px-3 py-2 rounded-xl font-medium border border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${getStatusColor(
                                            editValues.status
                                        )}`}
                                    >
                                        {STATUSES.map((status) => (
                                            <option
                                                key={status.id}
                                                value={status.id}
                                                className="bg-slate-900 text-white"
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Assignee */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Assignee
                                    </label>
                                    <UserSelector
                                        selectedUserId={editValues.assigneeId}
                                        onSelect={(userId) => {
                                            setEditValues({ ...editValues, assigneeId: userId });
                                            handleUpdate("assigneeId", userId);
                                        }}
                                        placeholder="Unassigned"
                                    />
                                </div>

                                {/* Priority */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        Priority
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {PRIORITIES.map((priority) => (
                                            <button
                                                key={priority}
                                                onClick={() => {
                                                    setEditValues({
                                                        ...editValues,
                                                        priority: priority as any,
                                                    });
                                                    handleUpdate("priority", priority);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${editValues.priority === priority
                                                    ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500"
                                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                                                            priority
                                                        )}`}
                                                    />
                                                    {priority}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Story Points */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Story Points
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="21"
                                        value={editValues.storyPoints || ""}
                                        onChange={(e) => {
                                            const val = e.target.value
                                                ? parseInt(e.target.value)
                                                : undefined;
                                            setEditValues({ ...editValues, storyPoints: val });
                                        }}
                                        onBlur={() =>
                                            handleUpdate("storyPoints", editValues.storyPoints)
                                        }
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        placeholder="Estimate effort"
                                    />
                                </div>

                                {/* Labels */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-400 mb-2 block">
                                        Labels
                                    </label>
                                    <LabelManager
                                        issueId={issue.id}
                                        projectId={issue.projectId}
                                        selectedLabels={issue.labels || []}
                                        onUpdate={fetchIssueDetails}
                                    />
                                </div>

                                {/* Time Tracking */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50">
                                    <label className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Time Tracking
                                    </label>
                                    <TimeTracker issueId={issue.id} />
                                </div>

                                {/* Metadata */}
                                <div className="glass-card rounded-xl p-4 border border-slate-700/50 space-y-3 text-sm">
                                    <div>
                                        <p className="text-slate-500">Reporter</p>
                                        <p className="text-white font-medium">
                                            {issue.reporter
                                                ? `${issue.reporter.firstName} ${issue.reporter.lastName}`
                                                : "Unknown"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Created</p>
                                        <p className="text-white font-medium">
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Updated</p>
                                        <p className="text-white font-medium">
                                            {new Date(issue.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
