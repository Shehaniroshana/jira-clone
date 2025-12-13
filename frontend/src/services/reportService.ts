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
    totalPoints: number
    completedPoints: number
    remainingPoints: number
}

export const reportService = {
    // Get project statistics (status, priority, assignee distributions)
    getProjectStats: async (projectId: string): Promise<ProjectStats> => {
        const response = await api.get(`/api/reports/project/${projectId}/stats`)
        return response.data
    },

    // Get issues trend (daily issue creation over last 14 days)
    getIssuesTrend: async (projectId: string): Promise<TrendData[]> => {
        const response = await api.get(`/api/reports/project/${projectId}/trend`)
        return response.data
    },

    // Get sprint burndown data
    getSprintBurndown: async (sprintId: string): Promise<SprintBurndown> => {
        const response = await api.get(`/api/reports/sprint/${sprintId}/burndown`)
        return response.data
    },
}
