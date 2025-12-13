import { create } from 'zustand'
import type { Issue, CreateIssueInput, UpdateIssueInput } from '@/types'
import { issueService } from '@/services/issueService'

interface IssueState {
    issues: Record<string, Issue[]>
    currentIssue: Issue | null
    isLoading: boolean
    error: string | null
    fetchIssues: (projectId: string) => Promise<void>
    fetchIssue: (id: string) => Promise<void>
    createIssue: (data: CreateIssueInput) => Promise<Issue>
    updateIssue: (id: string, data: UpdateIssueInput) => Promise<void>
    deleteIssue: (id: string) => Promise<void>
    setCurrentIssue: (issue: Issue | null) => void
}

export const useIssueStore = create<IssueState>((set, get) => ({
    issues: {},
    currentIssue: null,
    isLoading: false,
    error: null,

    fetchIssues: async (projectId: string) => {
        set({ isLoading: true, error: null })
        try {
            const issues = await issueService.getByProject(projectId)
            set((state) => ({
                issues: { ...state.issues, [projectId]: issues },
                isLoading: false,
            }))
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    fetchIssue: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            const issue = await issueService.getById(id)
            set({ currentIssue: issue, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    createIssue: async (data: CreateIssueInput) => {
        set({ isLoading: true, error: null })
        try {
            const issue = await issueService.create(data)
            set((state) => {
                const projectIssues = state.issues[data.projectId] || []
                return {
                    issues: { ...state.issues, [data.projectId]: [...projectIssues, issue] },
                    isLoading: false,
                }
            })
            return issue
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateIssue: async (id: string, data: UpdateIssueInput) => {
        // Optimistic update
        const previousState = get().issues

        set((state) => {
            const newIssues = { ...state.issues }
            let updatedIssue: Issue | null = null

            // Find and update the issue in all projects (usually it's just one, but safety first)
            for (const projectId in newIssues) {
                const index = newIssues[projectId].findIndex(i => i.id === id)
                if (index !== -1) {
                    const currentIssue = newIssues[projectId][index]
                    updatedIssue = { ...currentIssue, ...data } as Issue

                    // Create a new array for this project to ensure immutability
                    const projectIssues = [...newIssues[projectId]]
                    projectIssues[index] = updatedIssue
                    newIssues[projectId] = projectIssues
                }
            }

            return {
                issues: newIssues,
                // Also update currentIssue if it matches
                currentIssue: state.currentIssue?.id === id
                    ? { ...state.currentIssue, ...data } as Issue
                    : state.currentIssue,
                error: null
                // Note: We intentionally don't set isLoading: true to avoid UI flickering during drag operations
            }
        })

        try {
            // Perform actual API call
            const issue = await issueService.update(id, data)

            // Update with server response (authoritative data)
            set((state) => {
                const newIssues = { ...state.issues }
                for (const projectId in newIssues) {
                    newIssues[projectId] = newIssues[projectId].map((i) =>
                        i.id === id ? issue : i
                    )
                }
                return {
                    issues: newIssues,
                    currentIssue: state.currentIssue?.id === id ? issue : state.currentIssue,
                    isLoading: false,
                }
            })
        } catch (error: any) {
            // Revert on failure
            set({
                issues: previousState,
                error: error.message || 'Failed to update issue',
                isLoading: false
            })
            throw error
        }
    },

    deleteIssue: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
            await issueService.delete(id)
            set((state) => {
                const newIssues = { ...state.issues }
                for (const projectId in newIssues) {
                    newIssues[projectId] = newIssues[projectId].filter((i) => i.id !== id)
                }
                return {
                    issues: newIssues,
                    currentIssue: state.currentIssue?.id === id ? null : state.currentIssue,
                    isLoading: false,
                }
            })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    setCurrentIssue: (issue: Issue | null) => {
        set({ currentIssue: issue })
    },
}))
