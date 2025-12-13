import api from '@/lib/api'
import type { User } from '@/types'

export const userService = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/api/users')
        return response.data
    },

    getById: async (id: string): Promise<User> => {
        const response = await api.get(`/api/users/${id}`)
        return response.data
    },

    searchUsers: async (query: string): Promise<User[]> => {
        const response = await api.get(`/api/users/search?q=${query}`)
        return response.data
    },
}
