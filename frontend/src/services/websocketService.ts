
import { useAuthStore } from '@/store/authStore'

interface Message {
    type: string
    data?: any
}

interface SubscriptionMessage {
    type: 'subscribe' | 'unsubscribe'
    projectId?: string
    data?: any
}

class WebSocketService {
    private ws: WebSocket | null = null
    private reconnectAttempts = 0
    private readonly MAX_RECONNECT_ATTEMPTS = 5
    private WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
    private eventListeners: Map<string, Set<(data: any) => void>> = new Map()
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null

    // Support dynamic override from Electron preload
    setWsUrl(url: string) {
        this.WS_URL = url
    }

    constructor() {
        // Don't auto-connect in constructor
    }

    connect() {
        const { token } = useAuthStore.getState()
        if (!token) {
            console.warn('WebSocket: No token available')
            return
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected')
            return
        }

        try {
            // Connect with token in query parameter
            this.ws = new WebSocket(`${this.WS_URL}?token=${token}`)

            this.ws.onopen = () => {
                console.log('WebSocket connected')
                this.reconnectAttempts = 0
                this.dispatchEvent('connect', { message: 'Connected to WebSocket' })
            }

            this.ws.onmessage = (event) => {
                try {
                    const message: Message = JSON.parse(event.data)
                    console.log('WebSocket message received:', message)
                    this.dispatchEvent(message.type, message.data)
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error)
                }
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                this.dispatchEvent('error', { error: 'WebSocket error' })
            }

            this.ws.onclose = () => {
                console.log('WebSocket disconnected')
                this.dispatchEvent('disconnect', { message: 'Disconnected from WebSocket' })
                this.attemptReconnect()
            }
        } catch (error) {
            console.error('Failed to create WebSocket:', error)
        }
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
            console.log('Max reconnection attempts reached')
            return
        }

        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`)

        this.reconnectTimeout = setTimeout(() => {
            this.connect()
        }, delay)
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout)
            this.reconnectTimeout = null
        }

        if (this.ws) {
            const socket = this.ws
            if (socket.readyState === WebSocket.CONNECTING) {
                socket.onopen = () => socket.close()
                socket.onerror = () => {} 
            } else {
                socket.close()
            }
            this.ws = null
        }
    }

    subscribe(projectId: string) {
        const message: SubscriptionMessage = {
            type: 'subscribe',
            projectId,
        }
        this.send(message)
    }

    unsubscribe(projectId: string) {
        const message: SubscriptionMessage = {
            type: 'unsubscribe',
            projectId,
        }
        this.send(message)
    }

    send(message: Message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message))
        } else {
            console.warn('WebSocket not connected, cannot send message:', message)
        }
    }

    // Listen to events
    on(event: string, callback: (data: any) => void) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }
        this.eventListeners.get(event)!.add(callback)
    }

    // Unsubscribe from events
    off(event: string, callback?: (data: any) => void) {
        if (!this.eventListeners.has(event)) return

        if (callback) {
            this.eventListeners.get(event)!.delete(callback)
        } else {
            this.eventListeners.delete(event)
        }
    }

    private dispatchEvent(event: string, data: any) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event)!.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error)
                }
            })
        }
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }
}

export const wsService = new WebSocketService()
