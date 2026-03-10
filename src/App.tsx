import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import {
  TrendingUp, Scale, LayoutDashboard,
  ExternalLink, LogOut, User, ChevronDown, ChevronRight,
  BarChart3, FlaskConical, Cpu, Users, Megaphone, Sparkles,
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

// ─── Tipos ────────────────────────────────────────────────────
interface SidebarAgent {
  id: string; emoji: string; shortName: string; name: string; model: string
}
interface AgentCategory {
  key: string; label: string; icon: React.ReactNode; color: string; agents: SidebarAgent[]
}

// ─── Categorias do sidebar ────────────────────────────────────
const SIDEBAR_CATEGORIES: AgentCategory[] = [
  {
    key: 'juridico', label: 'Jurídico', icon: <Scale className="w-3.5 h-3.5" />, color: '#93C5FD',
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
    key: 'contador', label: 'Contador', icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#FCD34D',
    agents: [
      { id: 'ben-contador-tributarista',              emoji: '🧮', shortName: 'Triagem',      name: 'BEN Contador — Triagem',      model: 'Claude Haiku 4.5' },
      { id: 'ben-contador-tributarista-especialista', emoji: '📊', shortName: 'Especialista', name: 'BEN Contador — Especialista', model: 'Claude Sonnet' },
      { id: 'ben-contador-tributarista-planejamento', emoji: '🗺️', shortName: 'Planejamento', name: 'BEN Contador — Planejamento', model: 'Claude Sonnet' },
      { id: 'ben-contador-tributarista-creditos',     emoji: '💳', shortName: 'Créditos',     name: 'BEN Contador — Créditos',     model: 'Claude Haiku 4.5' },
      { id: 'ben-contador-tributarista-auditoria',    emoji: '🔍', shortName: 'Auditoria',    name: 'BEN Contador — Auditoria',    model: 'Claude Haiku 4.5' },
      { id: 'ben-contador-tributarista-relatorio',    emoji: '📋', shortName: 'Relatório',    name: 'BEN Contador — Relatório',    model: 'Claude Haiku 4.5' },
    ],
  },
  {
    key: 'perito', label: 'Perito Forense', icon: <FlaskConical className="w-3.5 h-3.5" />, color: '#C4B5FD',
    agents: [
      { id: 'ben-perito-forense',           emoji: '🔬', shortName: 'Padrão',       name: 'BEN Perito Forense — Padrão',    model: 'Claude Sonnet' },
      { id: 'ben-perito-forense-profundo',  emoji: '🧬', shortName: 'Profundo',     name: 'BEN Perito Forense — Profundo',  model: 'Claude Opus 4' },
      { id: 'ben-perito-forense-digital',   emoji: '💻', shortName: 'Digital',      name: 'BEN Perito Forense Digital',     model: 'Claude Sonnet' },
      { id: 'ben-perito-forense-laudo',     emoji: '📄', shortName: 'Laudo',        name: 'BEN Perito Forense — Laudo',     model: 'Claude Haiku 4.5' },
      { id: 'ben-perito-forense-contestar', emoji: '🛡️', shortName: 'Contraditório',name: 'BEN Perito — Contraditório',    model: 'Claude Haiku 4.5' },
      { id: 'ben-perito-forense-relatorio', emoji: '📊', shortName: 'Relatório',    name: 'BEN Perito Forense — Relatório', model: 'Claude Haiku 4.5' },
    ],
  },
  {
    key: 'growth', label: 'Growth & Marketing', icon: <Megaphone className="w-3.5 h-3.5" />, color: '#6EE7B7',
    agents: [
      { id: 'ben-atendente',              emoji: '🤝', shortName: 'Atendente',     name: 'BEN Atendente',               model: 'GPT-4o Mini' },
      { id: 'ben-conteudista',            emoji: '✍️', shortName: 'Conteudista',   name: 'BEN Conteudista Jurídico',    model: 'GPT-4o' },
      { id: 'ben-estrategista-campanhas', emoji: '📊', shortName: 'Campanhas',     name: 'BEN Estrategista Campanhas',  model: 'GPT-4o' },
      { id: 'ben-estrategista-marketing', emoji: '📣', shortName: 'Marketing',     name: 'BEN Estrategista Marketing',  model: 'GPT-4o' },
      { id: 'ben-analista-relatorios',    emoji: '📈', shortName: 'Relatórios',    name: 'BEN Analista de Relatórios',  model: 'Claude Haiku 4.5' },
      { id: 'ben-diretor-criativo',       emoji: '🎨', shortName: 'Dir. Criativo', name: 'BEN Diretor Criativo',        model: 'GPT-4o' },
    ],
  },
  {
    key: 'atendimento', label: 'Atendimento', icon: <Users className="w-3.5 h-3.5" />, color: '#7DD3FC',
    agents: [],
  },
  {
    key: 'sistema', label: 'Sistema', icon: <Cpu className="w-3.5 h-3.5" />, color: '#A5B4FC',
    agents: [
      { id: 'ben-engenheiro-prompt',      emoji: '🧠', shortName: 'Eng. Prompt',   name: 'BEN Engenheiro de Prompt',    model: 'GPT-4o' },
      { id: 'ben-analista-monitoramento', emoji: '🔍', shortName: 'Monitoramento', name: 'BEN Analista Monitoramento',  model: 'GPT-4o Mini' },
    ],
  },
]

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ onSelectAgent, activeAgentId }: {
  onSelectAgent: (id: string) => void
  activeAgentId: string | null
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ juridico: true })
  const { user, logout } = useAuth()

  const EXTERNAL = [
    { href: 'https://bengrowth.mauromoncao.adv.br', icon: TrendingUp,      label: 'Growth Center',   color: '#6EE7B7' },
    { href: 'https://juris.mauromoncao.adv.br',     icon: Scale,           label: 'Juris Center',    color: '#93C5FD' },
    { href: 'https://hub.mauromoncao.adv.br',        icon: LayoutDashboard, label: 'HUB Estratégico', color: '#C4B5FD' },
  ]

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col border-r"
      style={{ background: '#0d1f3c', borderColor: '#1a3560', minHeight: '100vh' }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="h-16 flex items-center gap-3 px-4 border-b flex-shrink-0"
        style={{ borderColor: '#1a3560' }}>
        <img
          src="/ben-logo.png"
          alt="BEN"
          className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
          onError={e => {
            const t = e.currentTarget; t.style.display = 'none'
            const fb = t.nextElementSibling as HTMLElement
            if (fb) fb.style.display = 'flex'
          }}
        />
        <div className="w-9 h-9 rounded-xl items-center justify-center hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)' }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold leading-none tracking-wide" style={{ color: '#E2B714' }}>BEN ECOSYSTEM</p>
          <p className="text-xs leading-none mt-1" style={{ color: '#7096C8' }}>IA Workspace</p>
        </div>
      </div>

      {/* ── Nav scrollável ────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">

        {/* Seção AGENTES */}
        <p className="text-xs px-2 mb-2 font-bold uppercase tracking-widest" style={{ color: '#4A6FA5' }}>
          Agentes
        </p>

        {SIDEBAR_CATEGORIES.filter(cat => cat.agents.length > 0).map(cat => (
          <div key={cat.key} className="mb-0.5">
            {/* Cabeçalho categoria */}
            <button
              onClick={() => setExpanded(p => ({ ...p, [cat.key]: !p[cat.key] }))}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: expanded[cat.key] ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
              onMouseEnter={e => { if (!expanded[cat.key]) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!expanded[cat.key]) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ color: cat.color }}>{cat.icon}</span>
              <span className="flex-1 text-left text-xs font-semibold" style={{ color: '#D0E4FF' }}>
                {cat.label}
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.12)', color: '#8AABCF' }}>
                {cat.agents.length}
              </span>
              {expanded[cat.key]
                ? <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: '#7096C8' }} />
                : <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#4A6FA5' }} />}
            </button>

            {/* Lista agentes */}
            {expanded[cat.key] && (
              <div className="ml-1 mt-0.5 mb-1 space-y-0.5">
                {cat.agents.map(agent => {
                  const isActive = activeAgentId === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => onSelectAgent(agent.id)}
                      title={agent.name}
                      className="w-full flex items-center gap-2 pl-5 pr-2 py-1.5 rounded-lg text-xs transition-all"
                      style={isActive
                        ? { background: 'rgba(228,183,30,0.22)', color: '#F0C830' }
                        : { color: '#A8C4E0' }
                      }
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span className="text-sm flex-shrink-0">{agent.emoji}</span>
                      <span className="flex-1 text-left truncate font-medium">{agent.shortName}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#E4B71E' }} />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Seção ECOSSISTEMA */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#1a3560' }}>
          <p className="text-xs px-2 mb-2 font-bold uppercase tracking-widest" style={{ color: '#4A6FA5' }}>
            Ecossistema
          </p>
          {EXTERNAL.map(({ href, icon: Icon, label, color }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group mb-0.5"
              style={{ color: '#A8C4E0' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.color = '#D0E4FF'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#A8C4E0'
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
              <span>{label}</span>
              <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#7096C8' }} />
            </a>
          ))}
        </div>
      </nav>

      {/* ── Rodapé ────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t flex items-center gap-2.5 flex-shrink-0" style={{ borderColor: '#1a3560' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(228,183,30,0.2)', border: '1px solid rgba(228,183,30,0.4)' }}>
          <User className="w-3.5 h-3.5" style={{ color: '#E4B71E' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: '#D0E4FF' }}>{user?.nome || 'Usuário'}</p>
          <p className="text-xs truncate" style={{ color: '#4A6FA5' }}>Advogados Associados</p>
        </div>
        <button onClick={logout} title="Sair"
          className="p-1.5 rounded-lg transition-colors flex-shrink-0"
          style={{ color: '#7096C8' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7096C8')}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
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
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f5' }}>
      <Sidebar onSelectAgent={handleSelectAgent} activeAgentId={activeAgentId} />
      <main className="flex-1 overflow-hidden">
        {React.cloneElement(
          children as React.ReactElement<{ pendingAgentId?: string | null; onAgentOpened?: (id: string) => void }>,
          {
            pendingAgentId,
            onAgentOpened: (id: string) => { setActiveAgentId(id); setPendingAgentId(null) },
          }
        )}
      </main>
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
