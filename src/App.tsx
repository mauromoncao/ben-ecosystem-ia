import React from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Sparkles, TrendingUp, Scale, LayoutDashboard, ExternalLink, LogOut, User } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import EcosystemWorkspace from './pages/EcosystemWorkspace'
import MonitorCustos from './pages/MonitorCustos'

// ─── PrivateRoute ─────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// ─── TopBar ───────────────────────────────────────────────────
function TopBar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const breadcrumbs: Record<string, string> = {
    '/workspace': 'Workspace de Agentes',
  }
  const page = breadcrumbs[location.pathname] || 'Ben Ecosystem IA'

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b"
      style={{ background: '#ffffff', borderColor: '#E5E7EB' }}>
      <div className="flex items-center gap-2 text-sm">
        <span style={{ color: '#888888' }}>Ben Ecosystem IA</span>
        <span style={{ color: '#cccccc' }}>›</span>
        <span style={{ color: '#222222', fontWeight: 600 }}>{page}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm" style={{ color: '#555555' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#0f2044' }}>
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline">{user?.nome}</span>
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: '#666666' }}>
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar() {
  const NAV = [
    { to: '/workspace', icon: Sparkles, label: 'Workspace IA' },
  ]

  const EXTERNAL = [
    { href: 'https://bengrowth.mauromoncao.adv.br', icon: TrendingUp, label: 'Growth Center', color: '#059669' },
    { href: 'https://juris.mauromoncao.adv.br',    icon: Scale,       label: 'Juris Center',  color: '#1d4ed8' },
    { href: 'https://hub.mauromoncao.adv.br',       icon: LayoutDashboard, label: 'HUB Estratégico', color: '#7c3aed' },
  ]

  return (
    <aside className="w-56 flex flex-col border-r"
      style={{ background: '#0f2044', borderColor: '#1a3060', minHeight: '100vh' }}>

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b" style={{ borderColor: '#1a3060' }}>
        <img
          src="/falcone-logo.png"
          alt="Falcone"
          className="w-8 h-8 rounded-lg object-cover"
          onError={(e) => {
            const t = e.currentTarget
            t.style.display = 'none'
            const fb = t.nextElementSibling as HTMLElement
            if (fb) fb.style.display = 'flex'
          }}
        />
        <div className="w-8 h-8 rounded-lg items-center justify-center hidden"
          style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)', minWidth: '2rem' }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs font-bold leading-none" style={{ color: '#D4A017' }}>BEN ECOSYSTEM</p>
          <p className="text-xs leading-none mt-0.5" style={{ color: '#6b7aaa' }}>IA Workspace</p>
        </div>
      </div>

      {/* Navegação interna */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs px-2 mb-2 font-semibold uppercase tracking-widest" style={{ color: '#4a5580' }}>
          Módulos
        </p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(212,160,23,0.2)', color: '#D4A017' } : {}}>
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}

        {/* Separador */}
        <div className="pt-4">
          <p className="text-xs px-2 mb-2 font-semibold uppercase tracking-widest" style={{ color: '#4a5580' }}>
            Ecossistema
          </p>
          {EXTERNAL.map(({ href, icon: Icon, label, color }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-white/5 group">
              <Icon className="w-4 h-4" style={{ color }} />
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </nav>

      {/* Rodapé */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#1a3060' }}>
        <p className="text-xs" style={{ color: '#4a5580' }}>Mauro Monção</p>
        <p className="text-xs" style={{ color: '#3a4570' }}>Advogados Associados</p>
      </div>
    </aside>
  )
}

// ─── Layout ───────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f5' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── AppRoutes ────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/workspace" replace /> : <LoginPage />
      } />
      <Route path="/workspace" element={
        <PrivateRoute>
          <Layout>
            <EcosystemWorkspace />
          </Layout>
        </PrivateRoute>
      } />
      {/* Rota oculta — monitor admin privado, não aparece no menu */}
      <Route path="/monitor-admin" element={<MonitorCustos />} />
      <Route path="*" element={<Navigate to="/workspace" replace />} />
    </Routes>
  )
}

// ─── App ──────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
