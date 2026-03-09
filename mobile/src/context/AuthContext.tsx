import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthState, UserProfile } from '../types'
import { ALLOWED_USERS, ADMIN_EMAILS } from '../lib/agents'
import { refreshSession, clearSession } from '../lib/storage'

const AUTH_KEY = 'ben_auth_user'

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Restaurar sessão salva
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setUser(parsed)
          setIsAuthenticated(true)
          await refreshSession()
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    restore()
  }, [])

  const login = useCallback(async (email: string, senha: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase()
    const found = ALLOWED_USERS.find(
      u => u.email.toLowerCase() === normalizedEmail && u.senha === senha.trim()
    )
    if (found) {
      const profile: UserProfile = {
        email: found.email,
        nome: found.nome,
        source: found.source,
      }
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(profile))
      await refreshSession()
      setUser(profile)
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY)
    await clearSession()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  if (loading) return null

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function useIsAdmin(email?: string) {
  return ADMIN_EMAILS.includes(email || '')
}
