import api from '@/lib/api'

export interface IssueLink {
    id: string
    sourceId: string
    targetId: string
    type: 'blocks' | 'is_blocked_by' | 'relates_to' | 'duplicates'
    source?: any
    target?: any
    createdAt: string
}

export const issueLinkService = {
    create: async (data: { sourceId: string; targetId: string; type: string }) => {
        const response = await api.post('/api/links', data)
        return response.data
    },

    delete: async (linkId: string) => {
        await api.delete(`/api/links/${linkId}`)
    },

    getByIssue: async (issueId: string) => {
        const response = await api.get(`/api/links/issue/${issueId}`)
        return response.data as IssueLink[]
    }
}
