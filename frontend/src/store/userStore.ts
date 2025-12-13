import { create } from 'zustand'
import type { User } from '@/types'
import { userService } from '@/services/userService'

interface UserState {
    users: User[]
    isLoading: boolean
    error: string | null
    fetchUsers: () => Promise<void>
    searchUsers: (query: string) => Promise<User[]>
}

export const useUserStore = create<UserState>((set) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null })
        try {
            const users = await userService.getAll()
            set({ users, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    searchUsers: async (query: string) => {
        try {
            return await userService.searchUsers(query)
        } catch (error: any) {
            set({ error: error.message })
            return []
        }
    },
}))
