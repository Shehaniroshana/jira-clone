import api from '@/lib/api'
import type { User, CreateUserInput, UpdateUserInput, UserStats, UpdateProjectInput, CreateProjectInput } from '@/types'

export const adminService = {
    // Get all users (admin only)
    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get('/api/admin/users')
        return response.data
    },

    // Create a new user (admin only)
    createUser: async (data: CreateUserInput): Promise<User> => {
        const response = await api.post('/api/admin/users', data)
        return response.data
    },

    // Update user details (admin only)
    updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
        const response = await api.put(`/api/admin/users/${id}`, data)
        return response.data
    },

    // Update user role (admin only)
    updateUserRole: async (id: string, role: string): Promise<User> => {
        const response = await api.put(`/api/admin/users/${id}/role`, { role })
        return response.data
    },

    // Reset user password (admin only)
    resetUserPassword: async (id: string, password: string): Promise<{ message: string }> => {
        const response = await api.put(`/api/admin/users/${id}/password`, { password })
        return response.data
    },

    // Toggle user active status (admin only)
    toggleUserStatus: async (id: string): Promise<{ message: string; isActive: boolean; user: User }> => {
        const response = await api.post(`/api/admin/users/${id}/toggle-status`)
        return response.data
    },

    // Delete user (admin only)
    deleteUser: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/api/admin/users/${id}`)
        return response.data
    },

    getUserStats: async (): Promise<UserStats> => {
        const response = await api.get('/api/admin/stats/users')
        return response.data
    },

    // Get all projects (admin only)
    getAllProjects: async (): Promise<any[]> => {
        const response = await api.get('/api/admin/projects')
        return response.data
    },

    // Delete project (admin only)
    deleteProject: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(`/api/admin/projects/${id}`)
        return response.data
    },

    // Create project (admin only)
    createProject: async (data: CreateProjectInput): Promise<any> => {
        const response = await api.post('/api/admin/projects', data)
        return response.data
    },

    // Update project (admin only)
    updateProject: async (id: string, data: UpdateProjectInput): Promise<any> => {
        const response = await api.put(`/api/admin/projects/${id}`, data)
        return response.data
    },

    // Get project stats (admin only)
    getProjectStats: async (): Promise<{ totalProjects: number; totalMembers: number }> => {
        const response = await api.get('/api/admin/stats/projects')
        return response.data
    },
}
