import api from '@/lib/api'
import type { ActivityLog } from '@/types'

export const activityService = {
    // Get activity by issue
    getByIssue: async (issueId: string): Promise<ActivityLog[]> => {
        const response = await api.get(`/api/activity/issue/${issueId}`)
        return response.data
    },

    // Get activity by project
    getByProject: async (projectId: string): Promise<ActivityLog[]> => {
        const response = await api.get(`/api/activity/project/${projectId}`)
        return response.data
    }
}
