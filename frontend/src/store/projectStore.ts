import { create } from 'zustand'
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types'
import { projectService } from '@/services/projectService'

interface ProjectState {
    projects: Project[]
    currentProject: Project | null
    isLoading: boolean
    error: string | null
    fetchProjects: () => Promise<void>
    fetchProject: (id: string) => Promise<void>
    createProject: (data: CreateProjectInput) => Promise<Project>
    updateProject: (id: string, data: UpdateProjectInput) => Promise<void>
    deleteProject: (id: string) => Promise<void>
    setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    fetchProjects: async () => {
        set({ isLoading: true, error: null })
        try {
            const projects = await projectService.getAll()
            set({ projects, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    fetchProject: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            const project = await projectService.getById(id)
            set({ currentProject: project, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    createProject: async (data: CreateProjectInput) => {
        set({ isLoading: true, error: null })
        try {
            const project = await projectService.create(data)
            set((state) => ({
                projects: [...state.projects, project],
                isLoading: false,
            }))
            return project
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateProject: async (id: string, data: UpdateProjectInput) => {
        set({ isLoading: true, error: null })
        try {
            const project = await projectService.update(id, data)
            set((state) => ({
                projects: state.projects.map((p) => (p.id === id ? project : p)),
                currentProject: state.currentProject?.id === id ? project : state.currentProject,
                isLoading: false,
            }))
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    deleteProject: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            await projectService.delete(id)
            set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
                currentProject: state.currentProject?.id === id ? null : state.currentProject,
                isLoading: false,
            }))
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    setCurrentProject: (project: Project | null) => {
        set({ currentProject: project })
    },
}))
