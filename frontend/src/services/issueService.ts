import api from '@/lib/api'
import type {
    Issue,
    CreateIssueInput,
    UpdateIssueInput,
    Comment,
    ActivityLog,
} from '@/types'

export const issueService = {
    async getByProject(projectId: string): Promise<Issue[]> {
        const response = await api.get<Issue[]>(`/api/issues/project/${projectId}`)
        return response.data
    },

    async getById(id: string): Promise<Issue> {
        const response = await api.get<Issue>(`/api/issues/${id}`)
        return response.data
    },

    async create(data: CreateIssueInput): Promise<Issue> {
        const response = await api.post<Issue>('/api/issues', data)
        return response.data
    },

    async update(id: string, data: UpdateIssueInput): Promise<Issue> {
        const response = await api.put<Issue>(`/api/issues/${id}`, data)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/api/issues/${id}`)
    },

    async getComments(issueId: string): Promise<Comment[]> {
        try {
            const response = await api.get<Comment[]>(`/api/comments/issue/${issueId}`)
            return response.data
        } catch (error) {
            console.error('Failed to fetch comments:', error)
            return []
        }
    },

    async getActivities(issueId: string): Promise<ActivityLog[]> {
        try {
            const response = await api.get<ActivityLog[]>(`/api/activity/issue/${issueId}`)
            return response.data
        } catch (error) {
            console.error('Failed to fetch activities:', error)
            return []
        }
    },
}
