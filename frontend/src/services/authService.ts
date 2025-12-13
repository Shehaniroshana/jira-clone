import api from '@/lib/api'
import type {
    AuthResponse,
    LoginInput,
    RegisterInput,
    User,
} from '@/types'

export const authService = {
    async register(data: RegisterInput): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/api/auth/register', data)
        return response.data
    },

    async login(data: LoginInput): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/api/auth/login', data)
        return response.data
    },

    async getMe(): Promise<User> {
        const response = await api.get<User>('/api/auth/me')
        return response.data
    },
}
