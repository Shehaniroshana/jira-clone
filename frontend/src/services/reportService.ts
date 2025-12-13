import api from '@/lib/api'

export interface ProjectStats {
    statusCounts: { status: string; count: number }[]
    priorityCounts: { priority: string; count: number }[]
    assigneeCounts: {
        assigneeId: string | null
        firstName: string
        lastName: string
        count: number
    }[]
}

export interface TrendData {
    date: string
    count: number
}

export interface SprintBurndown {
    sprint: string
    sprintStatus: string
    totalPoints: number
    completedPoints: number
    remainingPoints: number
    totalIssues: number
    completedIssues: number
    remainingIssues: number
    completionRate: number
    idealBurndown?: { date: string; points: number }[]
    actualBurndown?: { date: string; points: number }[]
}

export interface StatusCount {
    status: string
    count: number
}

export interface PriorityCount {
    priority: string
    count: number
}

export interface TypeCount {
    type: string
    count: number
}

export interface DailyStats {
    date: string
    created: number
    resolved: number
}

export interface TeamMemberStats {
    userId: string
    firstName: string
    lastName: string
    email: string
    avatar: string
    assignedIssues: number
    completedIssues: number
    inProgressCount: number
    totalPoints: number
    completedPoints: number
    timeLogged: number
}

export interface AssigneeCount {
    assigneeId: string | null
    firstName: string
    lastName: string
    email: string
    count: number
}

export interface SprintStats {
    id: string
    name: string
    status: string
    totalIssues: number
    completedIssues: number
    totalPoints: number
    completedPoints: number
    startDate: string | null
    endDate: string | null
}

export interface LabelStats {
    labelId: string
    labelName: string
    color: string
    count: number
}

export interface IssueAgingBucket {
    bucket: string
    count: number
}

export interface WeeklyVelocity {
    week: string
    created: number
    completed: number
    pointsCompleted: number
}

export interface ComprehensiveStats {
    // Summary
    totalIssues: number
    openIssues: number
    completedIssues: number
    totalPoints: number
    completedPoints: number
    avgResolutionTime: number
    totalTimeLogged: number

    // Distributions
    statusCounts: StatusCount[]
    priorityCounts: PriorityCount[]
    typeCounts: TypeCount[]

    // Trends
    dailyTrend: DailyStats[]

    // Team
    teamStats: TeamMemberStats[]
    assigneeCounts: AssigneeCount[]

    // Sprints
    sprintStats: SprintStats[]

    // Labels
    labelStats: LabelStats[]

    // Aging
    agingBuckets: IssueAgingBucket[]

    // Velocity
    weeklyVelocity: WeeklyVelocity[]

    // Recent activity
    recentCreated: number
    recentResolved: number
}

export const reportService = {
    // Get basic project statistics
    getProjectStats: async (projectId: string): Promise<ProjectStats> => {
        const response = await api.get(`/api/reports/project/${projectId}/stats`)
        return response.data
    },

    // Get comprehensive project statistics
    getComprehensiveStats: async (projectId: string): Promise<ComprehensiveStats> => {
        const response = await api.get(`/api/reports/project/${projectId}/comprehensive`)
        return response.data
    },

    // Get issues trend (daily issue creation over last 14 days)
    getIssuesTrend: async (projectId: string): Promise<TrendData[]> => {
        const response = await api.get(`/api/reports/project/${projectId}/trend`)
        return response.data
    },

    // Get team performance metrics
    getTeamPerformance: async (projectId: string): Promise<TeamMemberStats[]> => {
        const response = await api.get(`/api/reports/project/${projectId}/team`)
        return response.data
    },

    // Get sprint burndown data
    getSprintBurndown: async (sprintId: string): Promise<SprintBurndown> => {
        const response = await api.get(`/api/reports/sprint/${sprintId}/burndown`)
        return response.data
    },
}
