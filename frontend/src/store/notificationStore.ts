import { create } from 'zustand'
import api from '@/lib/api'
import type { Notification } from '@/types'

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    error: string | null

    fetchNotifications: () => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null })
        try {
            const response = await api.get('/api/notifications')
            const sortedNotifications = response.data.sort((a: Notification, b: Notification) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            const unreadCount = sortedNotifications.filter((n: Notification) => !n.isRead).length
            set({
                notifications: sortedNotifications,
                unreadCount,
                isLoading: false
            })
        } catch (error: any) {
            set({
                error: error.response?.data?.error || 'Failed to fetch notifications',
                isLoading: false
            })
        }
    },

    markAsRead: async (id: string) => {
        try {
            // Optimistic update
            const notifications = get().notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            )
            const unreadCount = notifications.filter(n => !n.isRead).length
            set({ notifications, unreadCount })

            await api.put(`/api/notifications/${id}/read`)
        } catch (error: any) {
            // Revert on error if needed, but for read status it's usually fine
            console.error('Failed to mark notification as read:', error)
        }
    },

    markAllAsRead: async () => {
        try {
            // Optimistic update
            const notifications = get().notifications.map(n => ({ ...n, isRead: true }))
            set({ notifications, unreadCount: 0 })

            await api.put('/api/notifications/read-all')
        } catch (error: any) {
            console.error('Failed to mark all notifications as read:', error)
        }
    },

    addNotification: (notification: Notification) => {
        const currentNotifications = get().notifications
        const exists = currentNotifications.some(n => n.id === notification.id)
        if (exists) return

        const newNotifications = [notification, ...currentNotifications]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        set({
            notifications: newNotifications,
            unreadCount: get().unreadCount + 1
        })
    }
}))
