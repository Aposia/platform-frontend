'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { apiLogin, apiRegister, apiMe } from './api'

interface User {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
}

interface AuthCtx {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) { setIsLoading(false); return }
    try {
      const me = await apiMe()
      setUser(me)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('access_token', data.access_token)
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
    const me = await apiMe()
    setUser(me)
    window.location.href = '/dashboard'
  }

  const register = async (email: string, password: string, full_name: string) => {
    await apiRegister(email, password, full_name)
    const tokens = await apiLogin(email, password)
    localStorage.setItem('access_token', tokens.access_token)
    if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token)
    const me = await apiMe()
    setUser(me)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
