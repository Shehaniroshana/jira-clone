import api from '@/lib/api'
import type {
    Project,
    CreateProjectInput,
    UpdateProjectInput,
} from '@/types'

export interface ProjectMember {
    userId: string
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
    role: 'owner' | 'admin' | 'member' | 'viewer'
    joinedAt: string
}

export const projectService = {
    async getAll(): Promise<Project[]> {
        const response = await api.get<Project[]>('/api/projects')
        return response.data
    },

    async getById(id: string): Promise<Project> {
        const response = await api.get<Project>(`/api/projects/${id}`)
        return response.data
    },

    async create(data: CreateProjectInput): Promise<Project> {
        const response = await api.post<Project>('/api/projects', data)
        return response.data
    },

    async update(id: string, data: UpdateProjectInput): Promise<Project> {
        const response = await api.put<Project>(`/api/projects/${id}`, data)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/api/projects/${id}`)
    },

    // Member management
    async getMembers(projectId: string): Promise<ProjectMember[]> {
        const response = await api.get<ProjectMember[]>(`/api/projects/${projectId}/members`)
        return response.data
    },

    async addMember(projectId: string, userId: string, role: string = 'member'): Promise<void> {
        await api.post(`/api/projects/${projectId}/members`, { userId, role })
    },

    async updateMemberRole(projectId: string, userId: string, role: string): Promise<void> {
        await api.put(`/api/projects/${projectId}/members/${userId}`, { role })
    },

    async removeMember(projectId: string, userId: string): Promise<void> {
        await api.delete(`/api/projects/${projectId}/members/${userId}`)
    },
}
