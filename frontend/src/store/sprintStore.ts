import { create } from 'zustand'
import { sprintService } from '@/services/sprintService'
import type { Sprint, CreateSprintInput, UpdateSprintInput } from '@/types'

interface SprintState {
    sprints: Sprint[]
    currentSprint: Sprint | null
    isLoading: boolean
    error: string | null
    fetchSprints: (projectId: string) => Promise<void>
    fetchSprint: (id: string) => Promise<void>
    createSprint: (data: CreateSprintInput) => Promise<Sprint>
    updateSprint: (id: string, data: UpdateSprintInput) => Promise<void>
    startSprint: (id: string) => Promise<void>
    completeSprint: (id: string) => Promise<void>
    deleteSprint: (id: string) => Promise<void>
}

export const useSprintStore = create<SprintState>((set) => ({
    sprints: [],
    currentSprint: null,
    isLoading: false,
    error: null,

    fetchSprints: async (projectId: string) => {
        set({ isLoading: true, error: null })
        try {
            const sprints = await sprintService.getByProject(projectId)
            set({ sprints, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to fetch sprints',
                isLoading: false
            })
        }
    },

    fetchSprint: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            const sprint = await sprintService.getById(id)
            set({ currentSprint: sprint, isLoading: false })
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to fetch sprint',
                isLoading: false
            })
        }
    },

    createSprint: async (data: CreateSprintInput) => {
        set({ isLoading: true, error: null })
        try {
            const newSprint = await sprintService.create(data)
            set((state) => ({
                sprints: [...state.sprints, newSprint],
                isLoading: false
            }))
            return newSprint
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to create sprint',
                isLoading: false
            })
            throw error
        }
    },

    updateSprint: async (id: string, data: UpdateSprintInput) => {
        set({ isLoading: true, error: null })
        try {
            const updatedSprint = await sprintService.update(id, data)
            set((state) => ({
                sprints: state.sprints.map(s => s.id === id ? updatedSprint : s),
                currentSprint: state.currentSprint?.id === id ? updatedSprint : state.currentSprint,
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to update sprint',
                isLoading: false
            })
            throw error
        }
    },

    startSprint: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            const updatedSprint = await sprintService.start(id)
            set((state) => ({
                sprints: state.sprints.map(s => s.id === id ? updatedSprint : s),
                currentSprint: state.currentSprint?.id === id ? updatedSprint : state.currentSprint,
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to start sprint',
                isLoading: false
            })
            throw error
        }
    },

    completeSprint: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            const updatedSprint = await sprintService.complete(id)
            set((state) => ({
                sprints: state.sprints.map(s => s.id === id ? updatedSprint : s),
                currentSprint: state.currentSprint?.id === id ? updatedSprint : state.currentSprint,
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to complete sprint',
                isLoading: false
            })
            throw error
        }
    },

    deleteSprint: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            await sprintService.delete(id)
            set((state) => ({
                sprints: state.sprints.filter(s => s.id !== id),
                currentSprint: state.currentSprint?.id === id ? null : state.currentSprint,
                isLoading: false
            }))
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to delete sprint',
                isLoading: false
            })
            throw error
        }
    },
}))
