import { useState, useEffect } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationService } from '@/services/notificationService'
import type { Notification } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { user } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            fetchNotifications()
        }
    }, [user])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const data = await notificationService.getNotifications()
            setNotifications(data)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationService.markAsRead(notificationId)
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            )
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead()
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (error) {
            console.error('Failed to mark all as read:', error)
        }
    }

    const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await notificationService.deleteNotification(notificationId)
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
        } catch (error) {
            console.error('Failed to delete notification:', error)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id)
        }

        // Navigate based on entity type
        if (notification.entityType === 'issue' && notification.entityId) {
            // You might want to navigate to the issue detail or board
            setIsOpen(false)
        } else if (notification.entityType === 'project' && notification.entityId) {
            navigate(`/projects/${notification.entityId}/board`)
            setIsOpen(false)
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length

    const getNotificationIcon = (_type: string) => {
        // You can customize icons based on notification type
        return <Bell className="w-4 h-4" />
    }

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`

        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`

        const diffDays = Math.floor(diffHours / 24)
        if (diffDays < 7) return `${diffDays}d ago`

        return date.toLocaleDateString()
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all duration-300 group"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-br from-red-500 to-orange-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: -10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95, x: -10 }}
                            className="absolute left-full bottom-0 ml-4 w-96 bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 z-[100] overflow-hidden origin-bottom-left"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/50">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Notifications</h3>
                                    <p className="text-xs text-slate-500">
                                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                                    </p>
                                </div>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
                                    >
                                        <Check className="w-3 h-3" />
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">Loading notifications...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                                        <p className="text-slate-500 font-medium">No notifications</p>
                                        <p className="text-xs text-slate-600 mt-1">You're all caught up!</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-800/50">
                                        {notifications.map((notification, index) => (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={cn(
                                                    "p-4 hover:bg-slate-800/30 transition-all cursor-pointer group relative",
                                                    !notification.isRead && "bg-cyan-500/5 border-l-2 border-cyan-500"
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                        notification.isRead
                                                            ? "bg-slate-800 text-slate-500"
                                                            : "bg-cyan-500/20 text-cyan-400"
                                                    )}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm font-medium mb-1",
                                                            notification.isRead ? "text-slate-400" : "text-white"
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-slate-500 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-slate-600 mt-1.5">
                                                            {getRelativeTime(notification.createdAt)}
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleMarkAsRead(notification.id)
                                                                }}
                                                                className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDelete(notification.id, e)}
                                                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
                                    <button
                                        onClick={() => {
                                            // Navigate to notifications page if you have one
                                            setIsOpen(false)
                                        }}
                                        className="w-full py-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
