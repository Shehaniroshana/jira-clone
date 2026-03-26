import { useState, useEffect } from "react";
import {
    X,
    FileText,
    Maximize2,
    CheckCircle2,
    Layout
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
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();

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
                title: t('common.updated'),
                description: t('issue.update_success'),
            });
        } catch (error) {
            console.error("Failed to update issue:", error);
            toast({
                title: "Error",
                description: t('issue.update_failed'),
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

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-[1200px] h-[90vh] glass-card bg-[#0a0e17]/95 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col border border-white/10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex-none flex items-start justify-between p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
                        <div className="flex items-start gap-4 flex-1">
                            {/* Type Icon */}
                            <div className={`mt-1 p-2.5 rounded-xl ${getTypeColor(issue.type)} bg-opacity-20 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                                {getTypeIcon(issue.type)}
                            </div>

                            {/* Title & Key */}
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-3 text-sm text-slate-400 font-mono mb-1">
                                    <span>{issue.key}</span>
                                    <span className="text-slate-600">/</span>
                                    <span className="capitalize">{issue.type}</span>
                                </div>
                                {editing.title ? (
                                    <input
                                        type="text"
                                        value={editValues.title}
                                        onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                                        onBlur={() => handleUpdate("title", editValues.title)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleUpdate("title", editValues.title);
                                            if (e.key === "Escape") setEditing({ ...editing, title: false });
                                        }}
                                        className="text-2xl font-bold text-white bg-slate-800/50 border-b-2 border-cyan-500 focus:outline-none w-full px-2 py-1 rounded"
                                        autoFocus
                                    />
                                ) : (
                                    <h2
                                        className="text-2xl font-bold text-white cursor-pointer hover:text-cyan-400 transition-colors leading-tight"
                                        onClick={() => setEditing({ ...editing, title: true })}
                                    >
                                        {issue.title}
                                    </h2>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Link to={`/projects/${issue.projectId}/issues/${issue.id}`} target="_blank">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                                    <Maximize2 className="w-5 h-5" />
                                </Button>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">

                            {/* LEFT COLUMN: Main Content (8 cols) */}
                            <div className="lg:col-span-8 p-6 lg:p-8 space-y-8 border-r border-white/5 bg-gradient-to-b from-transparent to-slate-900/30">

                                {/* Description */}
                                <div className="group space-y-3">
                                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                                        <FileText className="w-4 h-4 text-cyan-500" />
                                        <h3>{t('common.description')}</h3>
                                    </div>
                                    <div className="bg-slate-900/40 rounded-xl p-1 border border-white/5 hover:border-cyan-500/30 transition-colors">
                                        {editing.description ? (
                                            <textarea
                                                value={editValues.description}
                                                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                                                onBlur={() => handleUpdate("description", editValues.description)}
                                                className="w-full min-h-[150px] bg-slate-950/50 rounded-lg p-4 text-slate-200 focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-y font-mono text-sm leading-relaxed border-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <div
                                                className="prose prose-invert max-w-none text-slate-300 cursor-pointer min-h-[100px] p-4 rounded-lg hover:bg-slate-800/30 transition-colors"
                                                onClick={() => setEditing({ ...editing, description: true })}
                                            >
                                                {issue.description ? (
                                                    <div className="whitespace-pre-wrap">{issue.description}</div>
                                                ) : (
                                                    <span className="text-slate-500 italic flex items-center gap-2">
                                                        <Layout className="w-4 h-4" /> {t('issue.add_description')}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Tabs Section */}
                                <Tabs defaultValue="subtasks" className="w-full">
                                    <TabsList className="bg-slate-900/50 p-1 border border-white/5 rounded-xl backdrop-blur-md mb-6 w-full justify-start">
                                        <TabsTrigger value="subtasks" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                                            {t('common.subtasks')}
                                        </TabsTrigger>
                                        <TabsTrigger value="comments" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
                                            {t('common.comments')} <span className="ml-2 text-xs bg-slate-800 px-1.5 py-0.5 rounded-full">{comments.length}</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                                            {t('common.activity')}
                                        </TabsTrigger>
                                        <TabsTrigger value="linked" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
                                            {t('common.linked_issues')}
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="min-h-[300px]">
                                        <TabsContent value="subtasks" className="mt-0">
                                            <SubtaskSection issueId={issue.id} onSubtaskChange={fetchIssueDetails} />
                                        </TabsContent>
                                        <TabsContent value="comments" className="mt-0">
                                            <CommentSection issueId={issue.id} comments={comments} onCommentAdded={fetchComments} />
                                        </TabsContent>
                                        <TabsContent value="activity" className="mt-0">
                                            <ActivityTimeline activities={activities} />
                                        </TabsContent>
                                        <TabsContent value="linked" className="mt-0">
                                            <LinkedIssuesSection issueId={issue.id} projectId={issue.projectId} />
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>

                            {/* RIGHT COLUMN: Sidebar (4 cols) */}
                            <div className="lg:col-span-4 bg-slate-950/30 p-6 lg:p-8 space-y-6">

                                {/* Status Hero */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3" /> {t('common.status')}
                                    </label>
                                    <select
                                        className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all hover:bg-slate-800 cursor-pointer appearance-none text-base font-medium shadow-lg"
                                        value={editValues.status}
                                        onChange={(e) => {
                                            setEditValues({ ...editValues, status: e.target.value as any })
                                            handleUpdate("status", e.target.value)
                                        }}
                                        style={{
                                            backgroundImage: "linear-gradient(45deg, transparent 50%, gray 50%), linear-gradient(135deg, gray 50%, transparent 50%)",
                                            backgroundPosition: "calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)",
                                            backgroundSize: "5px 5px, 5px 5px",
                                            backgroundRepeat: "no-repeat"
                                        }}
                                    >
                                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </div>

                                <div className="h-px bg-white/5" />

                                {/* Details Group */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-slate-300">{t('common.details')}</h4>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Priority */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-500">{t('common.priority')}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {PRIORITIES.map((priority) => (
                                                    <button
                                                        key={priority}
                                                        onClick={() => {
                                                            setEditValues({ ...editValues, priority: priority as any });
                                                            handleUpdate("priority", priority);
                                                        }}
                                                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-all border ${editValues.priority === priority
                                                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                                                            : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-600"
                                                            }`}
                                                    >
                                                        {priority}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Assignee */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-500">{t('common.assignee')}</label>
                                            <UserSelector
                                                selectedUserId={editValues.assigneeId}
                                                onSelect={(userId) => {
                                                    setEditValues({ ...editValues, assigneeId: userId });
                                                    handleUpdate("assigneeId", userId);
                                                }}
                                                placeholder={t('common.unassigned')}
                                            />
                                        </div>

                                        {/* Story Points */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-500">{t('common.story_points')}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-3 pr-8 py-2 text-white focus:border-cyan-500 outline-none text-sm"
                                                    value={editValues.storyPoints || ''}
                                                    onChange={(e) => setEditValues({ ...editValues, storyPoints: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    onBlur={() => handleUpdate("storyPoints", editValues.storyPoints)}
                                                    placeholder="-"
                                                />
                                                <div className="absolute right-3 top-2 text-slate-600 text-[10px] font-bold uppercase tracking-wider">PTS</div>
                                            </div>
                                        </div>

                                        {/* Labels */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-500">{t('common.labels')}</label>
                                            <LabelManager
                                                issueId={issue.id}
                                                projectId={issue.projectId}
                                                selectedLabels={issue.labels || []}
                                                onUpdate={fetchIssueDetails}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5" />

                                {/* Tracking */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-300">{t('common.tracking')}</h4>
                                    <TimeTracker issueId={issue.id} />
                                </div>

                                {/* Meta Info */}
                                <div className="pt-4 mt-auto">
                                    <div className="bg-slate-900/30 rounded-lg p-3 space-y-2 text-xs border border-white/5 text-slate-500">
                                        <div className="flex justify-between">
                                            <span>{t('common.reporter')}</span>
                                            <span className="text-slate-300">{issue.reporter?.firstName} {issue.reporter?.lastName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('common.created')}</span>
                                            <span className="text-slate-300">{new Date(issue.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('common.updated')}</span>
                                            <span className="text-slate-300">{new Date(issue.updatedAt).toLocaleDateString()}</span>
                                        </div>
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
