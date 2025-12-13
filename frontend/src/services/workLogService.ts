import api from '@/lib/api'
import type { WorkLog, CreateWorkLogInput, UpdateWorkLogInput } from '@/types'

export const workLogService = {
    // Create a new work log
    create: async (input: CreateWorkLogInput): Promise<WorkLog> => {
        const response = await api.post('/api/worklogs', input)
        return response.data
    },

    // Get work log by ID
    getById: async (id: string): Promise<WorkLog> => {
        const response = await api.get(`/api/worklogs/${id}`)
        return response.data
    },

    // Get all work logs for an issue
    getByIssue: async (issueId: string): Promise<WorkLog[]> => {
        const response = await api.get(`/api/worklogs/issue/${issueId}`)
        return response.data
    },

    // Get current user's work logs
    getMyWorkLogs: async (): Promise<WorkLog[]> => {
        const response = await api.get('/api/worklogs/user/me')
        return response.data
    },

    // Update a work log
    update: async (id: string, input: UpdateWorkLogInput): Promise<WorkLog> => {
        const response = await api.put(`/api/worklogs/${id}`, input)
        return response.data
    },

    // Delete a work log
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/worklogs/${id}`)
    },

    // Update estimated time for an issue
    updateEstimate: async (issueId: string, estimatedTime: number): Promise<void> => {
        await api.put(`/api/worklogs/issue/${issueId}/estimate`, { estimatedTime })
    },

    // Get total time spent on an issue
    getTotalTime: async (issueId: string): Promise<number> => {
        const response = await api.get(`/api/worklogs/issue/${issueId}/total`)
        return response.data.timeSpent
    },

    // Get remaining time for an issue
    getRemainingTime: async (issueId: string): Promise<number> => {
        const response = await api.get(`/api/worklogs/issue/${issueId}/remaining`)
        return response.data.remainingTime
    },
}
