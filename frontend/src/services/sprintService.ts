import api from '@/lib/api'
import type {
    Sprint,
    CreateSprintInput,
    UpdateSprintInput,
} from '@/types'

export const sprintService = {
    async getByProject(projectId: string): Promise<Sprint[]> {
        const response = await api.get<Sprint[]>(`/api/sprints/project/${projectId}`)
        return response.data
    },

    async getById(id: string): Promise<Sprint> {
        const response = await api.get<Sprint>(`/api/sprints/${id}`)
        return response.data
    },

    async create(data: CreateSprintInput): Promise<Sprint> {
        const response = await api.post<Sprint>('/api/sprints', data)
        return response.data
    },

    async update(id: string, data: UpdateSprintInput): Promise<Sprint> {
        const response = await api.put<Sprint>(`/api/sprints/${id}`, data)
        return response.data
    },

    async start(id: string): Promise<Sprint> {
        const response = await api.post<Sprint>(`/api/sprints/${id}/start`)
        return response.data
    },

    async complete(id: string): Promise<Sprint> {
        const response = await api.post<Sprint>(`/api/sprints/${id}/complete`)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/api/sprints/${id}`)
    },
}
