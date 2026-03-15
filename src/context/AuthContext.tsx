/**
 * Ben Ecosystem IA — AuthContext
 * Autenticação compartilhada com Ben Growth Center e Ben Juris Center.
 * Aceita tokens vindos via query-string (?token=...) ou localStorage.
 */
import React, { createContext, useContext, useState, useEffect } from 'react'

interface AuthUser {
  email: string
  nome: string
  source: 'growth' | 'juris' | 'ecosystem' | 'hub'
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (email: string, senha: string) => Promise<boolean>
  loginWithToken: (token: string, source: AuthUser['source']) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// Credenciais locais (lidas exclusivamente de variáveis de ambiente)
// ⚠️ SEGURANÇA: sem fallback hardcoded — configure VITE_AUTH_* no Cloudflare Pages
const LOCAL_CREDENTIALS = [
  { email: import.meta.env.VITE_AUTH_EMAIL_1, senha: import.meta.env.VITE_AUTH_SENHA_1, nome: 'Mauro Monção' },
  { email: import.meta.env.VITE_AUTH_EMAIL_2, senha: import.meta.env.VITE_AUTH_SENHA_2, nome: 'Mauro Monção' },
].filter(c => c.email && c.senha)

const STORAGE_KEY = 'ben_ecosystem_auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    // 1. Tenta pegar token da URL (vindo do HUB, Growth ou Juris)
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const source = (params.get('source') as AuthUser['source']) || 'hub'

    if (token) {
      // Token simples: base64(email:source)
      try {
        const decoded = atob(token)
        const [email] = decoded.split(':')
        if (email) {
          const authUser: AuthUser = { email, nome: email.split('@')[0], source }
          setUser(authUser)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
          // Limpa query string sem recarregar
          window.history.replaceState({}, '', window.location.pathname)
          return
        }
      } catch {
        // token inválido, continua
      }
    }

    // 2. Verifica localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const login = async (email: string, senha: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 600))
    const found = LOCAL_CREDENTIALS.find(c => c.email === email && c.senha === senha)
    if (found) {
      const authUser: AuthUser = { email: found.email, nome: found.nome, source: 'ecosystem' }
      setUser(authUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      return true
    }
    return false
  }

  const loginWithToken = (token: string, source: AuthUser['source']) => {
    try {
      const decoded = atob(token)
      const [email] = decoded.split(':')
      if (email) {
        const authUser: AuthUser = { email, nome: email.split('@')[0], source }
        setUser(authUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
      }
    } catch {
      // token inválido
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
