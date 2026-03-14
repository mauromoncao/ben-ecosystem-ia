import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import {
  TrendingUp, Scale, LayoutDashboard,
  ExternalLink, LogOut, User, ChevronDown, ChevronRight,
  BarChart3, FlaskConical, Cpu, Users, Megaphone, Sparkles,
  ChevronsLeft, ChevronsRight, Activity, Radio,
} from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import EcosystemWorkspace from './pages/EcosystemWorkspace'
import MonitorCustos from './pages/MonitorCustos'
import AssistenteGeral from './components/AssistenteGeral'

// ─── PrivateRoute ─────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// ─── Tipos ────────────────────────────────────────────────────
interface SidebarAgent {
  id: string; emoji: string; shortName: string; name: string; model: string; badge?: string; badgeColor?: string
}
interface AgentCategory {
  key: string; label: string; icon: React.ReactNode; color: string; agents: SidebarAgent[]
}

// ─── Categorias do sidebar ────────────────────────────────────
const SIDEBAR_CATEGORIES: AgentCategory[] = [
  {
    key: 'juridico', label: 'Jurídico', icon: <Scale className="w-3.5 h-3.5" />, color: '#93C5FD',
    agents: [
      { id: 'ben-super-agente-juridico',           emoji: '⭐', shortName: 'Agente Maximus',         name: 'AGENTE OPERACIONAL MAXIMUS',       model: 'Claude Opus 4',   badge: 'OPUS',   badgeColor: '#92400e' },
      { id: 'ben-agente-operacional-premium',      emoji: '🔷', shortName: 'Agente Premium',         name: 'AGENTE OPERACIONAL PREMIUM',       model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-agente-operacional-standard',     emoji: '🟢', shortName: 'Agente Standard',        name: 'AGENTE OPERACIONAL STANDARD',      model: 'Claude Haiku 4',  badge: 'HAIKU',  badgeColor: '#16a34a' },
      { id: 'ben-tributarista-estrategista',       emoji: '⚖️', shortName: 'Tributarista Estrat.',   name: 'AGENTE TRIBUTARISTA ESTRATEGISTA', model: 'Claude Opus 4',   badge: 'OPUS',   badgeColor: '#b45309' },
      { id: 'ben-processualista-estrategico',      emoji: '📋', shortName: 'Processualista Estrat.', name: 'AGENTE PROCESSUALISTA ESTRATÉGICO',model: 'Claude Opus 4',   badge: 'OPUS',   badgeColor: '#1e3a5f' },
      { id: 'ben-pesquisador-juridico',            emoji: '🔎', shortName: 'Pesquisador',            name: 'BEN Pesquisador Jurídico',         model: 'Perplexity' },
    ],
  },
  {
    key: 'contador', label: 'Contador', icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#FCD34D',
    agents: [
      { id: 'ben-contador-tributarista',              emoji: '🧮', shortName: 'Triagem',         name: 'BEN Contador — Triagem',         model: 'Claude Haiku 4',  badge: 'HAIKU',  badgeColor: '#16a34a' },
      { id: 'ben-contador-especialista',              emoji: '📊', shortName: 'Especialista',    name: 'BEN Contador — Especialista',    model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-planejamento',              emoji: '🗺️', shortName: 'Planejamento',    name: 'BEN Contador — Planejamento',    model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-creditos',                  emoji: '💳', shortName: 'Créditos',        name: 'BEN Contador — Créditos',        model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-auditoria',                 emoji: '🔍', shortName: 'Auditoria',       name: 'BEN Contador — Auditoria',       model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-relatorio',                 emoji: '📋', shortName: 'Relatório',       name: 'BEN Contador — Relatório',       model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-tributarista-planejamento', emoji: '🗂️', shortName: 'Trib. Planej.',   name: 'BEN Contador Trib. — Planejamento', model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-tributarista-creditos',     emoji: '💰', shortName: 'Trib. Créditos',  name: 'BEN Contador Trib. — Créditos',  model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-tributarista-auditoria',    emoji: '🔎', shortName: 'Trib. Auditoria', name: 'BEN Contador Trib. — Auditoria', model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-contador-tributarista-relatorio',    emoji: '📑', shortName: 'Trib. Relatório', name: 'BEN Contador Trib. — Relatório', model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
    ],
  },
  {
    key: 'perito', label: 'Perito Forense', icon: <FlaskConical className="w-3.5 h-3.5" />, color: '#C4B5FD',
    agents: [
      { id: 'ben-perito-forense',           emoji: '🔬', shortName: 'Padrão',        name: 'BEN Perito Forense — Padrão',     model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-perito-forense-profundo',  emoji: '🧬', shortName: 'Profundo',       name: 'BEN Perito Forense — Profundo',   model: 'Claude Opus 4',   badge: 'OPUS',   badgeColor: '#b45309' },
      { id: 'ben-perito-forense-digital',   emoji: '💻', shortName: 'Digital',        name: 'BEN Perito Forense Digital',      model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-perito-forense-laudo',     emoji: '📄', shortName: 'Laudo',          name: 'BEN Perito Forense — Laudo',      model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-perito-forense-contestar', emoji: '🛡️', shortName: 'Contraditório',  name: 'BEN Perito — Contraditório',      model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-perito-forense-relatorio', emoji: '📊', shortName: 'Relatório',      name: 'BEN Perito Forense — Relatório',  model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
      { id: 'ben-perito-imobiliario',       emoji: '🏠', shortName: 'Imobiliário',    name: 'BEN Perito Imobiliário — ABNT',   model: 'Claude Sonnet 4', badge: 'SONNET', badgeColor: '#1d4ed8' },
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
    key: 'sistema', label: 'Sistema', icon: <Cpu className="w-3.5 h-3.5" />, color: '#A5B4FC',
    agents: [
      { id: 'ben-assistente-geral',       emoji: '🤖', shortName: 'BEN Copilot',       name: 'BEN Copilot — Universal',        model: 'GPT-4o',          badge: 'FIXO',   badgeColor: '#6d28d9' },
      { id: 'ben-engenheiro-prompt',      emoji: '🧠', shortName: 'Eng. Prompt',       name: 'BEN Engenheiro de Prompt',       model: 'GPT-4o' },
      { id: 'ben-analista-monitoramento', emoji: '🔍', shortName: 'Monitoramento',     name: 'BEN Analista Monitoramento',     model: 'Claude Haiku 4.5' },
      { id: 'ben-monitor-juridico',       emoji: '📡', shortName: 'Monitor Jurídico',  name: 'BEN Monitor Jurídico DJe + CNJ', model: 'Claude Sonnet 4', badge: 'NEW',    badgeColor: '#0e7490' },
      { id: 'ben-assistente-cnj',         emoji: '⚖️', shortName: 'Assistente CNJ',    name: 'BEN Assistente CNJ DataJud',     model: 'Claude Sonnet 4', badge: 'NEW',    badgeColor: '#0e7490' },
      { id: 'ben-assistente-voz',         emoji: '🎙️', shortName: 'Assistente Voz',    name: 'BEN Assistente Voz — TTS',       model: 'Claude Haiku 4' },
    ],
  },
]

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({
  onSelectAgent,
  activeAgentId,
  collapsed,
  onToggleCollapse,
}: {
  onSelectAgent: (id: string) => void
  activeAgentId: string | null
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ juridico: true })
  const { user, logout } = useAuth()

  const navigate = useNavigate()

  const EXTERNAL = [
    { href: 'https://bengrowth.mauromoncao.adv.br', icon: TrendingUp,      label: 'Growth Center',   color: '#6EE7B7', internal: false },
    { href: 'https://juris.mauromoncao.adv.br',     icon: Scale,           label: 'Juris Center',    color: '#93C5FD', internal: false },
    { href: 'https://hub.mauromoncao.adv.br',        icon: LayoutDashboard, label: 'HUB Estratégico', color: '#C4B5FD', internal: false },
  ]

  const MONITOR_ITEM = { path: '/monitor-admin', icon: Activity, label: 'Monitor de Tokens', color: '#FCA5A5' }

  return (
    <aside
      className="flex-shrink-0 flex flex-col border-r transition-all duration-300"
      style={{
        background: '#0d1f3c',
        borderColor: '#1a3560',
        minHeight: '100vh',
        width: collapsed ? '56px' : '224px',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo + botão recolher ─────────────────────────── */}
      <div
        className="h-16 flex items-center border-b flex-shrink-0"
        style={{
          borderColor: '#1a3560',
          padding: collapsed ? '0 12px' : '0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="flex-shrink-0 relative">
            <img
              src="/ben-logo.png"
              alt="BEN"
              className="w-8 h-8 rounded-lg object-cover"
              style={{ border: '1.5px solid rgba(228,183,30,0.4)' }}
              onError={e => {
                const t = e.currentTarget; t.style.display = 'none'
                const fb = t.nextElementSibling as HTMLElement
                if (fb) fb.style.display = 'flex'
              }}
            />
            <div className="w-8 h-8 rounded-lg items-center justify-center hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)', border: '1.5px solid rgba(228,183,30,0.4)' }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Texto — oculto quando recolhido */}
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <p className="text-xs font-extrabold leading-none tracking-wide whitespace-nowrap" style={{ color: '#E2B714' }}>BEN ECOSYSTEM</p>
              <p className="text-xs leading-none mt-1 whitespace-nowrap" style={{ color: '#7096C8' }}>IA Workspace</p>
            </div>
          )}
        </div>

        {/* Seta recolher/expandir */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            color: '#7096C8',
            marginLeft: collapsed ? '0' : '4px',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#D0E4FF' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#7096C8' }}
        >
          {collapsed
            ? <ChevronsRight className="w-3.5 h-3.5" />
            : <ChevronsLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Nav scrollável ────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3" style={{ padding: collapsed ? '12px 6px' : '12px 8px' }}>

        {/* Label AGENTES — oculto quando recolhido */}
        {!collapsed && (
          <p className="text-xs px-2 mb-2 font-bold uppercase tracking-widest" style={{ color: '#4A6FA5' }}>
            Agentes
          </p>
        )}

        {SIDEBAR_CATEGORIES.filter(cat => cat.agents.length > 0).map(cat => (
          <div key={cat.key} className="mb-0.5">

            {/* ── Modo expandido: cabeçalho categoria ─────── */}
            {!collapsed ? (
              <>
                <button
                  onClick={() => setExpanded(p => ({ ...p, [cat.key]: !p[cat.key] }))}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                  style={{ background: expanded[cat.key] ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                  onMouseEnter={e => { if (!expanded[cat.key]) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { if (!expanded[cat.key]) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                  <span className="flex-1 text-left text-xs font-semibold" style={{ color: '#D0E4FF' }}>{cat.label}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.12)', color: '#8AABCF' }}>
                    {cat.agents.length}
                  </span>
                  {expanded[cat.key]
                    ? <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: '#7096C8' }} />
                    : <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: '#4A6FA5' }} />}
                </button>

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
                            : { color: '#A8C4E0' }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="text-sm flex-shrink-0">{agent.emoji}</span>
                          <span className="flex-1 text-left truncate font-medium">{agent.shortName}</span>
                          {agent.badge && (
                            <span className="text-xs rounded font-bold flex-shrink-0" style={{ background: `${agent.badgeColor}28`, color: agent.badgeColor, fontSize: '7px', padding: '1px 4px', letterSpacing: '0.04em' }}>
                              {agent.badge}
                            </span>
                          )}
                          {isActive && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#E4B71E' }} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              /* ── Modo recolhido: apenas ícone da categoria com tooltip ── */
              <div className="relative group mb-1">
                <button
                  onClick={() => onSelectAgent(cat.agents[0]?.id)}
                  title={cat.label}
                  className="w-full flex items-center justify-center py-2 rounded-lg transition-all"
                  style={{ color: cat.color }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {cat.icon}
                </button>
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  style={{ background: '#0d1f3c', color: '#D0E4FF', border: '1px solid #1a3560', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                  {cat.label} ({cat.agents.length})
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Seção ECOSSISTEMA */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#1a3560' }}>
          {!collapsed && (
            <p className="text-xs px-2 mb-2 font-bold uppercase tracking-widest" style={{ color: '#4A6FA5' }}>
              Ecossistema
            </p>
          )}
          {EXTERNAL.map(({ href, icon: Icon, label, color }) => (
            collapsed ? (
              <div key={href} className="relative group mb-1">
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center py-2 rounded-lg transition-all"
                  style={{ color }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                  style={{ background: '#0d1f3c', color: '#D0E4FF', border: '1px solid #1a3560', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                  {label}
                </div>
              </div>
            ) : (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group mb-0.5"
                style={{ color: '#A8C4E0' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#D0E4FF' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8C4E0' }}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <span>{label}</span>
                <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#7096C8' }} />
              </a>
            )
          ))}

          {/* ── Monitor de Tokens — link interno ─────────── */}
          {collapsed ? (
            <div className="relative group mb-1 mt-1">
              <button
                onClick={() => navigate(MONITOR_ITEM.path)}
                className="w-full flex items-center justify-center py-2 rounded-lg transition-all"
                style={{ color: MONITOR_ITEM.color }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(252,165,165,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Activity className="w-3.5 h-3.5" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: '#0d1f3c', color: '#FCA5A5', border: '1px solid #1a3560', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                Monitor de Tokens
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate(MONITOR_ITEM.path)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group mb-0.5 mt-1"
              style={{ color: '#A8C4E0' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(252,165,165,0.1)'; e.currentTarget.style.color = '#FCA5A5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8C4E0' }}
            >
              <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: MONITOR_ITEM.color }} />
              <span>Monitor de Tokens</span>
              <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(252,165,165,0.15)', color: '#FCA5A5' }}>ADMIN</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Rodapé ────────────────────────────────────────── */}
      <div
        className="py-3 border-t flex items-center flex-shrink-0"
        style={{
          borderColor: '#1a3560',
          padding: collapsed ? '12px 8px' : '12px 16px',
          gap: collapsed ? '0' : '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(228,183,30,0.2)', border: '1px solid rgba(228,183,30,0.4)' }}>
          <User className="w-3.5 h-3.5" style={{ color: '#E4B71E' }} />
        </div>
        {!collapsed && (
          <>
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
          </>
        )}
      </div>
    </aside>
  )
}

// ─── Layout ───────────────────────────────────────────────────
function Layout({ children }: { children: React.ReactNode }) {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleSelectAgent = (id: string) => {
    setActiveAgentId(id)
    setPendingAgentId(id)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f2f5' }}>
      <Sidebar
        onSelectAgent={handleSelectAgent}
        activeAgentId={activeAgentId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />
      <main className="flex-1 overflow-hidden">
        {React.cloneElement(
          children as React.ReactElement<{ pendingAgentId?: string | null; onAgentOpened?: (id: string) => void }>,
          {
            pendingAgentId,
            onAgentOpened: (id: string) => { setActiveAgentId(id); setPendingAgentId(null) },
          }
        )}
      </main>
      {/* ── BEN Copilot — Copiloto fixo em todas as telas ── */}
      <AssistenteGeral />
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
