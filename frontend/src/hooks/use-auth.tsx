import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '@/services/api'
import { TOKEN_KEY, USER_KEY } from '@/lib/constants'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  primaryRole: string | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isOrganizer: boolean
  isTeacher: boolean
  isStudent: boolean
  isParent: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; password_confirmation: string; role: string; phone?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function getStoredUser(): User | null {
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try { return JSON.parse(stored) as User } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [token, setToken] = useState<string | null>(getStoredToken)
  const [loading, setLoading] = useState(!user)

  const fetchUser = useCallback(async () => {
    const storedToken = getStoredToken()
    if (!storedToken) { setLoading(false); return }
    try {
      const me = await authApi.me()
      setUser(me)
      localStorage.setItem(USER_KEY, JSON.stringify(me))
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handleLogout = () => {
      setToken(getStoredToken())
      setUser(getStoredUser())
    }
    window.addEventListener("auth:logout", handleLogout)
    return () => window.removeEventListener("auth:logout", handleLogout)
  }, [])

  useEffect(() => {
    if (token && !user) fetchUser()
    else setLoading(false)
  }, [token, user, fetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
  }, [])

  const register = useCallback(async (data: { name: string; email: string; password: string; password_confirmation: string; role: string; phone?: string }) => {
    const response = await authApi.register(data)
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(response.user))
  }, [])

  const signOut = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchUser()
  }, [fetchUser])

  const primaryRole = user?.role ?? null
  const isAuthenticated = !!user && !!token
  const isAdmin = user?.role === 'admin'
  const isOrganizer = user?.role === 'organizer'
  const isTeacher = user?.role === 'teacher'
  const isStudent = user?.role === 'student'
  const isParent = user?.role === 'parent'

  const value = useMemo<AuthContextValue>(() => ({
    user, token, primaryRole, loading, isAuthenticated,
    isAdmin, isOrganizer, isTeacher, isStudent, isParent,
    refresh, signOut, login, register,
  }), [user, token, loading, isAuthenticated, isAdmin, isOrganizer, isTeacher, isStudent, refresh, signOut, login, register])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
