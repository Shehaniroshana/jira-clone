import api from '@/lib/api'
import type { Issue, CreateSubtaskInput, SubtaskProgress } from '@/types'

export const subtaskService = {
    // Get all subtasks for an issue
    getSubtasks: async (issueId: string): Promise<Issue[]> => {
        const response = await api.get(`/api/subtasks/issue/${issueId}`)
        return response.data
    },

    // Create a new subtask
    createSubtask: async (issueId: string, data: CreateSubtaskInput): Promise<Issue> => {
        const response = await api.post(`/api/subtasks/issue/${issueId}`, data)
        return response.data
    },

    // Update subtask status
    updateSubtaskStatus: async (subtaskId: string, status: string): Promise<Issue> => {
        const response = await api.put(`/api/subtasks/${subtaskId}/status`, { status })
        return response.data
    },

    // Delete a subtask
    deleteSubtask: async (subtaskId: string): Promise<{ message: string }> => {
        const response = await api.delete(`/api/subtasks/${subtaskId}`)
        return response.data
    },

    // Get subtask progress for an issue
    getSubtaskProgress: async (issueId: string): Promise<SubtaskProgress> => {
        const response = await api.get(`/api/subtasks/issue/${issueId}/progress`)
        return response.data
    },
}
