import api from '@/lib/api'
import type {
    Comment,
    CreateCommentInput,
    UpdateCommentInput,
} from '@/types'

export const commentService = {
    async getByIssue(issueId: string): Promise<Comment[]> {
        const response = await api.get<Comment[]>(`/api/comments/issue/${issueId}`)
        return response.data
    },

    async create(data: CreateCommentInput): Promise<Comment> {
        const response = await api.post<Comment>('/api/comments', data)
        return response.data
    },

    async update(id: string, data: UpdateCommentInput): Promise<Comment> {
        const response = await api.put<Comment>(`/api/comments/${id}`, data)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/api/comments/${id}`)
    },
}
