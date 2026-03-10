import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import {
  Sparkles, TrendingUp, Scale, LayoutDashboard,
  ExternalLink, LogOut, User, ChevronDown, ChevronRight,
  BarChart3, FlaskConical, Cpu, Users, Megaphone,
} from 'lucide-react'
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

// ─── Tipos para agentes no sidebar ───────────────────────────
interface SidebarAgent {
  id: string
  emoji: string
  shortName: string
  name: string
  model: string
}

interface AgentCategory {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  agents: SidebarAgent[]
}

// ─── Dados dos agentes por categoria ─────────────────────────
const SIDEBAR_CATEGORIES: AgentCategory[] = [
  {
    key: 'juridico',
    label: 'Jurídico',
    icon: <Scale className="w-4 h-4" />,
    color: '#1d4ed8',
    agents: [
      { id: 'ben-super-agente-juridico',   emoji: '⭐', shortName: 'Super Agente',      name: 'BEN Super Agente Jurídico',     model: 'Claude Opus 4' },
      { id: 'ben-peticionista-juridico',   emoji: '⚖️', shortName: 'Peticionista',       name: 'BEN Peticionista Jurídico',     model: 'Claude Haiku 4.5' },
      { id: 'ben-contratualista',          emoji: '📋', shortName: 'Contratualista',     name: 'BEN Contratualista',            model: 'Claude Haiku 4.5' },
      { id: 'ben-mandatario-juridico',     emoji: '📜', shortName: 'Mandatário',         name: 'BEN Mandatário Jurídico',       model: 'Claude Haiku 4.5' },
      { id: 'ben-analista-processual',     emoji: '🔬', shortName: 'Analista Proc.',     name: 'BEN Analista Processual',       model: 'GPT-4o' },
      { id: 'ben-tributarista',            emoji: '💰', shortName: 'Tributarista',       name: 'BEN Tributarista',              model: 'Claude Haiku 4.5' },
      { id: 'ben-trabalhista',             emoji: '👷', shortName: 'Trabalhista',        name: 'BEN Trabalhista',               model: 'GPT-4o' },
      { id: 'ben-previdenciarista',        emoji: '🏛️', shortName: 'Previdenciarista',   name: 'BEN Previdenciarista',          model: 'Claude Haiku 4.5' },
      { id: 'ben-constitucionalista',      emoji: '⚡', shortName: 'Constitucionalista', name: 'BEN Constitucionalista',        model: 'GPT-4o' },
      { id: 'ben-especialista-compliance', emoji: '🛡️', shortName: 'Compliance',         name: 'BEN Especialista Compliance',   model: 'GPT-4o' },
      { id: 'ben-pesquisador-juridico',    emoji: '🔎', shortName: 'Pesquisador',        name: 'BEN Pesquisador Jurídico',      model: 'Perplexity' },
      { id: 'ben-relator-juridico',        emoji: '📚', shortName: 'Relator',            name: 'BEN Relator Jurídico',          model: 'GPT-4o' },
      { id: 'ben-redator-juridico',        emoji: '✒️', shortName: 'Redator',            name: 'BEN Redator Jurídico',          model: 'GPT-4o' },
      { id: 'ben-auditor-processual',      emoji: '🔏', shortName: 'Auditor',            name: 'BEN Auditor Processual',        model: 'Claude Haiku 4.5' },
      { id: 'ben-gestor-juridico',         emoji: '🏢', shortName: 'Gestor',             name: 'BEN Gestor Jurídico',           model: 'GPT-4o' },
      { id: 'ben-revisor-juridico',        emoji: '📝', shortName: 'Revisor',            name: 'BEN Revisor Jurídico',          model: 'Claude Haiku 4.5' },
      { id: 'ben-peticionista',            emoji: '⚖️', shortName: 'Peticionista G.',    name: 'BEN Peticionista',              model: 'Claude Haiku 4.5' },
    ],
  },
  {
    key: 'contador',
    label: 'Contador',
    icon: <BarChart3 className="w-4 h-4" />,
    color: '#d97706',
    agents: [
      { id: 'ben-contador-tributarista',              emoji: '🧮', shortName: 'Triagem',        name: 'BEN Contador — Triagem',      model: 'Claude Haiku 4.5' },
      { id: 'ben-contador-tributarista-especialista', emoji: '📊', shortName: 'Especialista',   name: 'BEN Contador — Especialista', model: 'Claude Sonnet' },
      { id: 'ben-contador-tributarista-planejamento', emoji: '🗺️', shortName: 'Planejamento',   name: 'BEN Contador — Planejamento', model: 'Claude Sonnet' },
      { id: 'ben-contador-tributarista-creditos',     emoji: '💳', shortName: 'Créditos',       name: 'BEN Contador — Créditos',     model: 'Claude Haiku 4.5' },
      { id: 'ben-contador-tributarista-auditoria',    emoji: '🔍', shortName: 'Auditoria',      name: 'BEN Contador — Auditoria',    model: 'Claude Haiku 4.5' },
      { id: 'ben-contador-tributarista-relatorio',    emoji: '📋', shortName: 'Relatório',      name: 'BEN Contador — Relatório',    model: 'Claude Haiku 4.5' },
    ],
  },
  {
    key: 'perito',
    label: 'Perito Forense',
    icon: <FlaskConical className="w-4 h-4" />,
    color: '#7c3aed',
    agents: [
      { id: 'ben-perito-forense',          emoji: '🔬', shortName: 'Padrão',    name: 'BEN Perito Forense — Padrão',    model: 'Claude Sonnet' },
      { id: 'ben-perito-forense-profundo', emoji: '🧬', shortName: 'Profundo',  name: 'BEN Perito Forense — Profundo',  model: 'Claude Opus 4' },
      { id: 'ben-perito-forense-digital',  emoji: '💻', shortName: 'Digital',   name: 'BEN Perito Forense Digital',     model: 'Claude Sonnet' },
      { id: 'ben-perito-forense-laudo',    emoji: '📄', shortName: 'Laudo',     name: 'BEN Perito Forense — Laudo',     model: 'Claude Haiku 4.5' },
      { id: 'ben-perito-forense-contestar',emoji: '🛡️', shortName: 'Contraditório', name: 'BEN Perito — Contraditório', model: 'Claude Haiku 4.5' },
      { id: 'ben-perito-forense-relatorio',emoji: '📊', shortName: 'Relatório', name: 'BEN Perito Forense — Relatório', model: 'Claude Haiku 4.5' },
    ],
  },
  {
    key: 'growth',
    label: 'Growth & Marketing',
    icon: <Megaphone className="w-4 h-4" />,
    color: '#059669',
    agents: [
      { id: 'ben-atendente',              emoji: '🤝', shortName: 'Atendente',      name: 'BEN Atendente',                  model: 'GPT-4o Mini' },
      { id: 'ben-conteudista',            emoji: '✍️', shortName: 'Conteudista',    name: 'BEN Conteudista Jurídico',       model: 'GPT-4o' },
      { id: 'ben-estrategista-campanhas', emoji: '📊', shortName: 'Campanhas',      name: 'BEN Estrategista Campanhas',     model: 'GPT-4o' },
      { id: 'ben-estrategista-marketing', emoji: '📣', shortName: 'Marketing',      name: 'BEN Estrategista Marketing',     model: 'GPT-4o' },
      { id: 'ben-analista-relatorios',    emoji: '📈', shortName: 'Relatórios',     name: 'BEN Analista de Relatórios',     model: 'Claude Haiku 4.5' },
      { id: 'ben-diretor-criativo',       emoji: '🎨', shortName: 'Dir. Criativo',  name: 'BEN Diretor Criativo',           model: 'GPT-4o' },
    ],
  },
  {
    key: 'atendimento',
    label: 'Atendimento',
    icon: <Users className="w-4 h-4" />,
    color: '#0369a1',
    agents: [],
  },
  {
    key: 'sistema',
    label: 'Sistema',
    icon: <Cpu className="w-4 h-4" />,
    color: '#4f46e5',
    agents: [
      { id: 'ben-engenheiro-prompt',      emoji: '🧠', shortName: 'Eng. Prompt',    name: 'BEN Engenheiro de Prompt',       model: 'GPT-4o' },
      { id: 'ben-analista-monitoramento', emoji: '🔍', shortName: 'Monitoramento',  name: 'BEN Analista Monitoramento',     model: 'GPT-4o Mini' },
    ],
  },
]

// ─── Context para comunicação Sidebar → Workspace ─────────────
export const AgentSelectContext = React.createContext<{
  selectedAgentId: string | null
  onSelectAgent: (id: string) => void
}>({ selectedAgentId: null, onSelectAgent: () => {} })

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ onSelectAgent, activeAgentId }: {
  onSelectAgent: (id: string) => void
  activeAgentId: string | null
}) {
  // Which categories are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    juridico: true,
  })

  const toggleCat = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const EXTERNAL = [
    { href: 'https://bengrowth.mauromoncao.adv.br', icon: TrendingUp,    label: 'Growth Center',   color: '#059669' },
    { href: 'https://juris.mauromoncao.adv.br',    icon: Scale,          label: 'Juris Center',    color: '#1d4ed8' },
    { href: 'https://hub.mauromoncao.adv.br',       icon: LayoutDashboard,label: 'HUB Estratégico', color: '#7c3aed' },
  ]

  return (
    <aside className="w-60 flex flex-col border-r overflow-hidden"
      style={{ background: '#0f2044', borderColor: '#1a3060', minHeight: '100vh' }}>

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b flex-shrink-0" style={{ borderColor: '#1a3060' }}>
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

      {/* Nav scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        {/* ── Seção AGENTES ── */}
        <p className="text-xs px-2 mb-3 font-semibold uppercase tracking-widest" style={{ color: '#4a5580' }}>
          Agentes
        </p>

        {SIDEBAR_CATEGORIES.filter(cat => cat.agents.length > 0).map(cat => (
          <div key={cat.key} className="mb-1">
            {/* Cabeçalho da categoria */}
            <button
              onClick={() => toggleCat(cat.key)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/5 group"
              style={{ color: expanded[cat.key] ? '#FFFFFF' : '#9ca3af' }}>
              <span style={{ color: cat.color }}>{cat.icon}</span>
              <span className="flex-1 text-left text-xs font-semibold">{cat.label}</span>
              <span className="text-xs mr-1" style={{ color: '#4a5580' }}>{cat.agents.length}</span>
              {expanded[cat.key]
                ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6b7aaa' }} />
                : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4a5580' }} />}
            </button>

            {/* Lista de agentes */}
            {expanded[cat.key] && (
              <div className="ml-2 mt-0.5 space-y-0.5">
                {cat.agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className="w-full flex items-center gap-2 pl-5 pr-2 py-1.5 rounded-lg text-xs transition-all hover:bg-white/8"
                    style={activeAgentId === agent.id
                      ? { background: 'rgba(212,160,23,0.18)', color: '#D4A017' }
                      : { color: '#9ca3af' }
                    }
                    title={agent.name}>
                    <span className="text-sm flex-shrink-0">{agent.emoji}</span>
                    <span className="flex-1 text-left truncate font-medium">{agent.shortName}</span>
                    {activeAgentId === agent.id && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D4A017' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ── Seção ECOSSISTEMA ── */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#1a3060' }}>
          <p className="text-xs px-2 mb-2 font-semibold uppercase tracking-widest" style={{ color: '#4a5580' }}>
            Ecossistema
          </p>
          {EXTERNAL.map(({ href, icon: Icon, label, color }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white hover:bg-white/5 group">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs">{label}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      </nav>

      {/* Rodapé */}
      <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: '#1a3060' }}>
        <p className="text-xs" style={{ color: '#4a5580' }}>Mauro Monção</p>
        <p className="text-xs" style={{ color: '#3a4570' }}>Advogados Associados</p>
      </div>
    </aside>
  )
}

// ─── Layout ───────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)

  const handleSelectAgent = (id: string) => {
    setActiveAgentId(id)
    setPendingAgentId(id)
  }

  return (
    <AgentSelectContext.Provider value={{ selectedAgentId: pendingAgentId, onSelectAgent: (id) => setActiveAgentId(id) }}>
      <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f5' }}>
        <Sidebar onSelectAgent={handleSelectAgent} activeAgentId={activeAgentId} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-hidden">
            {React.cloneElement(children as React.ReactElement<{ pendingAgentId?: string | null; onAgentOpened?: (id: string) => void }>, {
              pendingAgentId,
              onAgentOpened: (id: string) => { setActiveAgentId(id); setPendingAgentId(null) },
            })}
          </main>
        </div>
      </div>
    </AgentSelectContext.Provider>
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
      {/* Rota oculta — monitor admin privado */}
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
