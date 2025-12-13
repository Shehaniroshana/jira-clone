import api from '@/lib/api'
import type { Attachment } from '@/types'

export const attachmentService = {
    // Upload attachment
    upload: async (issueId: string, file: File): Promise<Attachment> => {
        const formData = new FormData()
        formData.append('file', file)

        // Check if api instance automatically sets Content-Type to multipart/form-data when body is FormData
        // Usually axios does.
        const response = await api.post(`/attachments/issue/${issueId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
        return response.data
    },

    // Delete attachment
    delete: async (id: string): Promise<void> => {
        await api.delete(`/attachments/${id}`)
    }
}
