import api from '@/lib/api'
import type { Label, CreateLabelInput, UpdateLabelInput } from '@/types'

export const labelService = {
    // Get all labels for a project
    getByProject: async (projectId: string): Promise<Label[]> => {
        const response = await api.get(`/api/labels/project/${projectId}`)
        return response.data
    },

    // Get a specific label
    getById: async (id: string): Promise<Label> => {
        const response = await api.get(`/api/labels/${id}`)
        return response.data
    },

    // Create a new label
    create: async (input: CreateLabelInput): Promise<Label> => {
        const response = await api.post('/api/labels', input)
        return response.data
    },

    // Update a label
    update: async (id: string, input: UpdateLabelInput): Promise<Label> => {
        const response = await api.put(`/api/labels/${id}`, input)
        return response.data
    },

    // Delete a label
    delete: async (id: string): Promise<void> => {
        await api.delete(`/api/labels/${id}`)
    },

    // Get all labels for an issue
    getByIssue: async (issueId: string): Promise<Label[]> => {
        const response = await api.get(`/api/labels/issue/${issueId}`)
        return response.data
    },

    // Add label to issue
    addToIssue: async (issueId: string, labelId: string): Promise<void> => {
        await api.post(`/api/labels/issue/${issueId}`, { labelId })
    },

    // Remove label from issue
    removeFromIssue: async (issueId: string, labelId: string): Promise<void> => {
        await api.delete(`/api/labels/issue/${issueId}/${labelId}`)
    },
}
