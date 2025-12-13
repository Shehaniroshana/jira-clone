import { BookOpen, CheckCircle2, Bug, Layers, ListTodo } from 'lucide-react'

export const ISSUE_TYPES = [
    { id: 'story', label: 'Story', icon: BookOpen, color: 'text-green-400 bg-green-500/20' },
    { id: 'task', label: 'Task', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/20' },
    { id: 'bug', label: 'Bug', icon: Bug, color: 'text-red-400 bg-red-500/20' },
    { id: 'epic', label: 'Epic', icon: Layers, color: 'text-purple-400 bg-purple-500/20' },
    { id: 'subtask', label: 'Subtask', icon: ListTodo, color: 'text-cyan-400 bg-cyan-500/20' },
]

export const PRIORITIES = ['lowest', 'low', 'medium', 'high', 'highest']

export const STATUSES = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'in_review', label: 'In Review' },
    { id: 'done', label: 'Done' },
]
