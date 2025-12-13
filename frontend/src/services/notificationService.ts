import api from '@/lib/api'
import type { Notification } from '@/types'

export const notificationService = {
    // Get current user's notifications
    getNotifications: async (): Promise<Notification[]> => {
        const response = await api.get('/api/notifications')
        return response.data
    },

    // Mark a single notification as read
    markAsRead: async (id: string): Promise<void> => {
        await api.put(`/api/notifications/${id}/read`)
    },

    // Mark all notifications as read
    markAllAsRead: async (): Promise<void> => {
        await api.put('/api/notifications/read-all')
    },

    // Delete a notification
    deleteNotification: async (id: string): Promise<void> => {
        await api.delete(`/api/notifications/${id}`)
    },
}
