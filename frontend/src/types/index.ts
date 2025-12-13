export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
    role: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface Project {
    id: string
    key: string
    name: string
    description: string
    icon?: string
    color?: string
    ownerId: string
    owner?: User
    members?: ProjectMember[]
    createdAt: string
    updatedAt: string
}

export interface ProjectMember {
    id: string
    projectId: string
    userId: string
    user?: User
    role: string
    createdAt: string
}

export interface Sprint {
    id: string
    projectId: string
    name: string
    goal?: string
    startDate?: string
    endDate?: string
    status: 'planned' | 'active' | 'completed'
    issues?: Issue[]
    createdAt: string
    updatedAt: string
}

export interface Issue {
    id: string
    projectId: string
    project?: Project
    sprintId?: string
    sprint?: Sprint
    parentIssueId?: string
    parentIssue?: Issue
    subTasks?: Issue[]
    key: string
    title: string
    description?: string
    type: 'story' | 'task' | 'bug' | 'epic' | 'subtask'
    status: 'todo' | 'in_progress' | 'in_review' | 'done'
    priority: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
    storyPoints?: number
    estimatedTime?: number // in minutes
    timeSpent?: number // in minutes
    assigneeId?: string
    assignee?: User
    reporterId: string
    reporter?: User
    watchers?: User[]
    position: number
    labels?: Label[]
    comments?: Comment[]
    attachments?: Attachment[]
    workLogs?: WorkLog[]
    createdAt: string
    updatedAt: string
}

export interface Comment {
    id: string
    issueId: string
    userId: string
    user?: User
    content: string
    createdAt: string
    updatedAt: string
}

export interface Attachment {
    id: string
    issueId: string
    userId: string
    user?: User
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
    createdAt: string
}

export interface ActivityLog {
    id: string
    userId: string
    user?: User
    projectId?: string
    issueId?: string
    action: string
    entityType: string
    entityId: string
    changes?: string
    createdAt: string
}

export interface AuthResponse {
    token: string
    user: User
}

export interface RegisterInput {
    email: string
    password: string
    firstName: string
    lastName: string
}

export interface LoginInput {
    email: string
    password: string
}

export interface CreateProjectInput {
    key: string
    name: string
    description?: string
    icon?: string
    color?: string
    ownerId: string
}

export interface UpdateProjectInput {
    name: string
    key?: string
    description?: string
    icon?: string
    color?: string
    ownerId?: string
}

export interface CreateIssueInput {
    projectId: string
    projectKey: string
    sprintId?: string
    title: string
    description?: string
    type: string
    priority: string
    assigneeId?: string
    storyPoints?: number
}

export interface UpdateIssueInput {
    title: string
    description?: string
    type: string
    status: string
    priority: string
    assigneeId?: string
    sprintId?: string | null
    storyPoints?: number
    position?: number
}

export interface CreateSprintInput {
    projectId: string
    name: string
    goal?: string
    startDate?: string
    endDate?: string
}

export interface UpdateSprintInput {
    name: string
    goal?: string
    startDate?: string
    endDate?: string
    status?: string
}

export interface CreateCommentInput {
    issueId: string
    content: string
}

export interface UpdateCommentInput {
    content: string
}

export interface Label {
    id: string
    projectId: string
    name: string
    color: string
    createdAt: string
}

export interface CreateLabelInput {
    projectId: string
    name: string
    color: string
}

export interface UpdateLabelInput {
    name: string
    color: string
}

export interface WorkLog {
    id: string
    issueId: string
    userId: string
    user?: User
    timeSpent: number // in minutes
    description: string
    loggedAt: string
    createdAt: string
    updatedAt: string
}

export interface CreateWorkLogInput {
    issueId: string
    timeSpent: number // in minutes
    description: string
    loggedAt?: string
}

export interface UpdateWorkLogInput {
    timeSpent: number
    description: string
}

// Admin types
export interface CreateUserInput {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: 'admin' | 'manager' | 'user'
    avatar?: string
}

export interface UpdateUserInput {
    email?: string
    firstName?: string
    lastName?: string
    role?: 'admin' | 'manager' | 'user'
    avatar?: string
    isActive?: boolean
}

export interface UserStats {
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    byRole: {
        admins: number
        managers: number
        users: number
    }
}

// Subtask types
export interface CreateSubtaskInput {
    title: string
    description?: string
    assigneeId?: string
    priority?: 'lowest' | 'low' | 'medium' | 'high' | 'highest'
}

export interface SubtaskProgress {
    total: number
    completed: number
    inProgress: number
    inReview: number
    todo: number
    percentage: number
}


export interface Notification {
    id: string
    userId: string
    user?: User
    actorId?: string
    actor?: User
    title: string
    message: string
    type: string // mention, assigned, status_change, etc.
    entityId?: string
    entityType?: string // issue, project, comment
    isRead: boolean
    createdAt: string
}

export interface IssueLink {
    id: string
    sourceId: string
    source?: Issue
    targetId: string
    target?: Issue
    type: string // blocks, is_blocked_by, relates_to, duplicates
    createdAt: string
}
