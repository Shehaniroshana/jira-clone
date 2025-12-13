import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(d)
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(d)
}

export function getInitials(firstName?: string, lastName?: string): string {
    if (!firstName || !lastName) return '??'
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'highest':
            return 'text-red-600 bg-red-50'
        case 'high':
            return 'text-orange-600 bg-orange-50'
        case 'medium':
            return 'text-yellow-600 bg-yellow-50'
        case 'low':
            return 'text-blue-600 bg-blue-50'
        case 'lowest':
            return 'text-gray-600 bg-gray-50'
        default:
            return 'text-gray-600 bg-gray-50'
    }
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'todo':
            return 'text-gray-700 bg-gray-100'
        case 'in_progress':
            return 'text-blue-700 bg-blue-100'
        case 'in_review':
            return 'text-purple-700 bg-purple-100'
        case 'done':
            return 'text-green-700 bg-green-100'
        default:
            return 'text-gray-700 bg-gray-100'
    }
}

export function getTypeIcon(type: string): string {
    switch (type) {
        case 'story':
            return '📖'
        case 'task':
            return '✓'
        case 'bug':
            return '🐛'
        case 'epic':
            return '⚡'
        default:
            return '📋'
    }
}
