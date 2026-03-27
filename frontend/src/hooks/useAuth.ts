import { useAuthStore } from '@/store/authStore'

/**
 * Thin selector hook over authStore.
 * Components import this instead of the raw store to avoid coupling to Zustand internals.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const logout = useAuthStore((s) => s.logout)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const setError = useAuthStore((s) => s.setError)

  const isAuthenticated = Boolean(token)

  return { user, token, isAuthenticated, isLoading, error, login, register, logout, fetchUser, setError }
}
