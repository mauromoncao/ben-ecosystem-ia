import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Send, FileText, X, Loader2, Plus, Trash2,
  Search, Copy, Check, Download, ChevronLeft,
  Maximize2, Minimize2,
  Globe, Paperclip, LayoutGrid,
  Clock, Sparkles, PanelRight,
  PanelRightClose, TrendingUp, Scale,
  BarChart3, Cpu,
  FlaskConical, Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Tipos ────────────────────────────────────────────────────
type Project = 'growth' | 'juris'

interface Agent {
  id: string; name: string; shortName: string; emoji: string
  description: string; model: string; category: string
  project: Project | 'both'; color: string; accentColor: string
  premium?: boolean
}
interface Message {
  id: string; role: 'user' | 'assistant'; content: string
  timestamp: string; modelUsed?: string; elapsed_ms?: number
  isLoading?: boolean; agentId?: string
}
interface Conversation {
  id: string; title: string; agentId: string; agentName: string
  agentEmoji: string; messages: Message[]; createdAt: string
  updatedAt: string; starred?: boolean
}

// ─── Agentes ──────────────────────────────────────────────────
const AGENTS: Agent[] = [
  // ── JURIS ──
  { id: 'ben-super-agente-juridico',  shortName: 'Super Agente',      name: 'BEN Super Agente Jurídico',       emoji: '⭐', description: 'Coordenação estratégica multidisciplinar — máxima performance.', model: 'Claude Opus 4', category: 'juridico', project: 'juris', color: '#92400e', accentColor: '#fef3c7', premium: true },
  { id: 'ben-peticionista-juridico',  shortName: 'Peticionista',       name: 'BEN Peticionista Jurídico',       emoji: '⚖️', description: 'Peças processuais conforme o caso concreto e jurisprudência.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'juris', color: '#1d4ed8', accentColor: '#dbeafe' },
  { id: 'ben-contratualista',         shortName: 'Contratualista',     name: 'BEN Contratualista',              emoji: '📋', description: 'Contratos empresariais, NDAs, societários e negociais.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'juris', color: '#7c3aed', accentColor: '#ede9fe' },
  { id: 'ben-mandatario-juridico',    shortName: 'Mandatário',         name: 'BEN Mandatário Jurídico',         emoji: '📜', description: 'Procurações, Ad Judicia, gerais e especiais.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'juris', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-analista-processual',    shortName: 'Analista Proc.',     name: 'BEN Analista Processual',         emoji: '🔬', description: 'Análise estratégica de processos com avaliação de risco.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#dc2626', accentColor: '#fee2e2' },
  { id: 'ben-tributarista',           shortName: 'Tributarista',       name: 'BEN Tributarista',                emoji: '💰', description: 'Direito tributário, planejamento fiscal e teses avançadas.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'juris', color: '#d97706', accentColor: '#fef3c7' },
  { id: 'ben-trabalhista',            shortName: 'Trabalhista',        name: 'BEN Trabalhista',                 emoji: '👷', description: 'Direito do trabalho, TST, reclamações e acordos.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#0369a1', accentColor: '#e0f2fe' },
  { id: 'ben-previdenciarista',       shortName: 'Previdenciarista',   name: 'BEN Previdenciarista',            emoji: '🏛️', description: 'Benefícios INSS, aposentadorias e revisões previdenciárias.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'juris', color: '#7c3aed', accentColor: '#ede9fe' },
  { id: 'ben-constitucionalista',     shortName: 'Constitucionalista', name: 'BEN Constitucionalista',          emoji: '⚡', description: 'MS, HC, Mandado de Injunção e ações constitucionais.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#b91c1c', accentColor: '#fee2e2' },
  { id: 'ben-especialista-compliance',shortName: 'Compliance',         name: 'BEN Especialista Compliance',     emoji: '🛡️', description: 'Conformidade LGPD, políticas de privacidade e proteção de dados.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#0f766e', accentColor: '#ccfbf1' },
  { id: 'ben-pesquisador-juridico',   shortName: 'Pesquisador',        name: 'BEN Pesquisador Jurídico',        emoji: '🔎', description: 'Pesquisa em tempo real: STF, STJ, TRF, TJPI com citações.', model: 'Perplexity', category: 'juridico', project: 'juris', color: '#6d28d9', accentColor: '#ede9fe' },
  { id: 'ben-relator-juridico',       shortName: 'Relator',            name: 'BEN Relator Jurídico',            emoji: '📚', description: 'Artigos jurídicos, pareceres técnicos e publicações.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#1e40af', accentColor: '#dbeafe' },
  { id: 'ben-redator-juridico',       shortName: 'Redator',            name: 'BEN Redator Jurídico',            emoji: '✒️', description: 'Redação técnica jurídica, memorandos, ofícios.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#374151', accentColor: '#f3f4f6' },
  { id: 'ben-auditor-processual',     shortName: 'Auditor',            name: 'BEN Auditor Processual',          emoji: '🔏', description: 'Auditoria de prazos críticos e conformidade OAB.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'juris', color: '#0f766e', accentColor: '#ccfbf1' },
  { id: 'ben-gestor-juridico',        shortName: 'Gestor',             name: 'BEN Gestor Jurídico',             emoji: '🏢', description: 'Gestão de escritório, produtividade e governança.', model: 'GPT-4o', category: 'juridico', project: 'juris', color: '#374151', accentColor: '#f3f4f6' },
  { id: 'ben-revisor-juridico',       shortName: 'Revisor',            name: 'BEN Revisor Jurídico',            emoji: '📝', description: 'Revisão técnica e linguística de peças jurídicas.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'growth', color: '#374151', accentColor: '#f3f4f6' },
  { id: 'ben-peticionista',           shortName: 'Peticionista',       name: 'BEN Peticionista',                emoji: '⚖️', description: 'Petições iniciais, recursos e peças de urgência.', model: 'Claude Haiku 4.5', category: 'juridico', project: 'growth', color: '#1d4ed8', accentColor: '#dbeafe' },
  // ── ENGENHEIRO (sistema) ──
  { id: 'ben-engenheiro-prompt',      shortName: 'Eng. Prompt',        name: 'BEN Engenheiro de Prompt',        emoji: '🧠', description: 'Otimização de prompts e arquitetura de agentes IA.', model: 'GPT-4o', category: 'sistema', project: 'juris', color: '#4f46e5', accentColor: '#e0e7ff' },
  // ── CONTADOR ──
  { id: 'ben-contador-tributarista',              shortName: 'Triagem',       name: 'BEN Contador — Triagem',      emoji: '🧮', description: 'Triagem fiscal: classifica e encaminha ao especialista.', model: 'Claude Haiku 4.5', category: 'contador', project: 'juris', color: '#92400e', accentColor: '#fef3c7' },
  { id: 'ben-contador-tributarista-especialista', shortName: 'Especialista',  name: 'BEN Contador — Especialista', emoji: '📊', description: 'Análise fiscal profunda e planejamento avançado.', model: 'Claude Sonnet', category: 'contador', project: 'juris', color: '#b45309', accentColor: '#fef9c3' },
  { id: 'ben-contador-tributarista-planejamento', shortName: 'Planejamento',  name: 'BEN Contador — Planejamento', emoji: '🗺️', description: 'Planejamento tributário estratégico.', model: 'Claude Sonnet', category: 'contador', project: 'juris', color: '#d97706', accentColor: '#fef3c7' },
  { id: 'ben-contador-tributarista-creditos',     shortName: 'Créditos',      name: 'BEN Contador — Créditos',     emoji: '💳', description: 'Recuperação de créditos tributários.', model: 'Claude Haiku 4.5', category: 'contador', project: 'juris', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-contador-tributarista-auditoria',    shortName: 'Auditoria',     name: 'BEN Contador — Auditoria',    emoji: '🔍', description: 'Auditoria fiscal e conformidade tributária.', model: 'Claude Haiku 4.5', category: 'contador', project: 'juris', color: '#dc2626', accentColor: '#fee2e2' },
  { id: 'ben-contador-tributarista-relatorio',    shortName: 'Relatório',     name: 'BEN Contador — Relatório',    emoji: '📋', description: 'Relatórios fiscais executivos e dashboards.', model: 'Claude Haiku 4.5', category: 'contador', project: 'juris', color: '#0369a1', accentColor: '#e0f2fe' },
  // ── PERITO ──
  { id: 'ben-perito-forense',          shortName: 'Padrão',       name: 'BEN Perito Forense — Padrão',    emoji: '🔬', description: 'Laudos e pareceres técnicos periciais.', model: 'Claude Sonnet', category: 'perito', project: 'juris', color: '#4f46e5', accentColor: '#e0e7ff' },
  { id: 'ben-perito-forense-profundo', shortName: 'Profundo',     name: 'BEN Perito Forense — Profundo',  emoji: '🧬', description: 'Análise pericial profunda — alto custo, máxima precisão.', model: 'Claude Opus 4', category: 'perito', project: 'juris', color: '#b91c1c', accentColor: '#fee2e2', premium: true },
  { id: 'ben-perito-forense-digital',  shortName: 'Digital',      name: 'BEN Perito Forense Digital',     emoji: '💻', description: 'Perícia digital e análise de evidências eletrônicas.', model: 'Claude Sonnet', category: 'perito', project: 'juris', color: '#7c3aed', accentColor: '#ede9fe' },
  { id: 'ben-perito-forense-laudo',    shortName: 'Laudo',        name: 'BEN Perito Forense — Laudo',     emoji: '📄', description: 'Elaboração de laudos periciais técnicos.', model: 'Claude Haiku 4.5', category: 'perito', project: 'juris', color: '#0369a1', accentColor: '#e0f2fe' },
  { id: 'ben-perito-forense-contestar',shortName: 'Contraditório',name: 'BEN Perito — Contraditório',     emoji: '🛡️', description: 'Contestação de laudos adversariais.', model: 'Claude Haiku 4.5', category: 'perito', project: 'juris', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-perito-forense-relatorio',shortName: 'Relatório',    name: 'BEN Perito Forense — Relatório', emoji: '📊', description: 'Relatórios periciais executivos.', model: 'Claude Haiku 4.5', category: 'perito', project: 'juris', color: '#374151', accentColor: '#f3f4f6' },
  // ── GROWTH ──
  { id: 'ben-atendente',              shortName: 'Atendente',      name: 'BEN Atendente',                  emoji: '🤝', description: 'Atendimento jurídico digital 24/7 e qualificação de leads.', model: 'GPT-4o Mini', category: 'atendimento', project: 'growth', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-conteudista',            shortName: 'Conteudista',    name: 'BEN Conteudista Jurídico',       emoji: '✍️', description: 'Artigos, posts e conteúdo institucional OAB-compliant.', model: 'GPT-4o', category: 'marketing', project: 'growth', color: '#7c3aed', accentColor: '#ede9fe' },
  { id: 'ben-estrategista-campanhas', shortName: 'Campanhas',      name: 'BEN Estrategista Campanhas',     emoji: '📊', description: 'Meta Ads e Google Ads — ROI e KPIs jurídicos.', model: 'GPT-4o', category: 'marketing', project: 'growth', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-estrategista-marketing', shortName: 'Marketing',      name: 'BEN Estrategista Marketing',     emoji: '📣', description: 'Redes sociais, Instagram, Reels e conteúdo OAB-compliant.', model: 'GPT-4o', category: 'marketing', project: 'growth', color: '#0369a1', accentColor: '#e0f2fe' },
  { id: 'ben-analista-relatorios',    shortName: 'Relatórios',     name: 'BEN Analista de Relatórios',     emoji: '📈', description: 'Relatório semanal com insights de performance.', model: 'Claude Haiku 4.5', category: 'marketing', project: 'growth', color: '#d97706', accentColor: '#fef3c7' },
  { id: 'ben-diretor-criativo',       shortName: 'Dir. Criativo',  name: 'BEN Diretor Criativo',           emoji: '🎨', description: 'Identidade visual, branding jurídico e direção criativa.', model: 'GPT-4o', category: 'marketing', project: 'growth', color: '#7c3aed', accentColor: '#ede9fe' },
  // ── SISTEMA ──
  { id: 'ben-analista-monitoramento', shortName: 'Monitoramento',  name: 'BEN Analista Monitoramento',     emoji: '🔍', description: 'Monitoramento de saúde do sistema e alertas críticos.', model: 'GPT-4o Mini', category: 'sistema', project: 'growth', color: '#dc2626', accentColor: '#fee2e2' },
]

// Agente padrão ao entrar no sistema
const DEFAULT_AGENT_ID = 'ben-redator-juridico'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  juridico:    <Scale className="w-3 h-3" />,
  contador:    <BarChart3 className="w-3 h-3" />,
  perito:      <FlaskConical className="w-3 h-3" />,
  marketing:   <TrendingUp className="w-3 h-3" />,
  atendimento: <Users className="w-3 h-3" />,
  sistema:     <Cpu className="w-3 h-3" />,
}

const STORAGE_KEY = 'ben_eco_convs_v2'
function loadConvs(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveConvs(c: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c.slice(0, 60))) } catch {}
}

// ─── Detecta se resposta deve abrir painel lateral ────────────
function shouldOpenArtifact(content: string): boolean {
  return content.length > 800 ||
    /petição|contrato|recurso|mandado|habeas|laudo|parecer|relatório|minuta|procuração|artigo|ementa/i.test(content)
}

// ─── Formata tempo ─────────────────────────────────────────────
function fmtTime(ms?: number) {
  if (!ms) return ''
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

// ─── Markdown renderer ─────────────────────────────────────────
function MarkdownContent({ content, dark = false }: { content: string; dark?: boolean }) {
  const base = dark ? '#E2E8F0' : '#1A1A1A'
  const muted = dark ? '#94A3B8' : '#6B7280'
  const codeBg = dark ? 'rgba(255,255,255,0.08)' : '#F3F4F6'
  const codeColor = dark ? '#F1C40F' : '#1d4ed8'
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'
  return (
    <div className="markdown-body text-sm leading-relaxed" style={{ color: base }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 pb-1 border-b" style={{ color: base, borderColor }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5" style={{ color: base }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: base }}>{children}</h3>,
          p: ({ children }) => <p className="mb-2.5 last:mb-0" style={{ lineHeight: '1.75', color: base }}>{children}</p>,
          ul: ({ children }) => <ul className="mb-2.5 pl-4 space-y-1" style={{ listStyleType: 'disc', color: base }}>{children}</ul>,
          ol: ({ children }) => <ol className="mb-2.5 pl-4 space-y-1" style={{ listStyleType: 'decimal', color: base }}>{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed" style={{ color: base }}>{children}</li>,
          strong: ({ children }) => <strong className="font-bold" style={{ color: base }}>{children}</strong>,
          em: ({ children }) => <em className="italic" style={{ color: muted }}>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 pl-4 py-1 my-2 italic rounded-r" style={{ borderColor: '#D4A017', background: dark ? 'rgba(212,160,23,0.1)' : '#FFFBF0', color: muted }}>
              {children}
            </blockquote>
          ),
          code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: codeBg, color: codeColor }}>
                {children}
              </code>
            ) : (
              <pre className="p-4 rounded-xl overflow-x-auto my-3 text-xs font-mono leading-relaxed" style={{ background: codeBg, color: codeColor }}>
                <code>{children}</code>
              </pre>
            ),
          hr: () => <hr className="my-4 border-t" style={{ borderColor }} />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline" style={{ color: dark ? '#93C5FD' : '#1d4ed8' }}>
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs border-collapse" style={{ borderColor }}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#F9FAFB' }}>{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold border" style={{ borderColor, color: base }}>{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 border" style={{ borderColor, color: base }}>{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Badge de modelo ───────────────────────────────────────────
function ModelBadge({ model }: { model: string }) {
  const isOpus    = /opus/i.test(model)
  const isSonnet  = /sonnet/i.test(model)
  const isGPT4o   = /gpt-4o/i.test(model) && !/mini/i.test(model)
  const isMini    = /mini/i.test(model)
  const isPerp    = /perplexity/i.test(model)
  const style =
    isOpus   ? { bg: '#fef3c7', color: '#92400e' } :
    isSonnet ? { bg: '#fce7f3', color: '#9d174d' } :
    isGPT4o  ? { bg: '#dbeafe', color: '#1e40af' } :
    isMini   ? { bg: '#e0f2fe', color: '#0369a1' } :
    isPerp   ? { bg: '#ede9fe', color: '#5b21b6' } :
               { bg: '#f3f4f6', color: '#374151' }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: style.bg, color: style.color }}>
      {model}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
interface EcosystemWorkspaceProps {
  pendingAgentId?: string | null
  onAgentOpened?: (id: string) => void
}

export default function EcosystemWorkspace({ pendingAgentId, onAgentOpened }: EcosystemWorkspaceProps) {
  const { user } = useAuth()

  // ── Estado principal ──────────────────────────────────────
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(() => {
    return AGENTS.find(a => a.id === DEFAULT_AGENT_ID) || AGENTS[12] || null
  })
  const [conversations, setConversations] = useState<Conversation[]>(loadConvs)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useSearch, setUseSearch] = useState(false)
  const [attachment, setAttachment] = useState<{ name: string; text: string } | null>(null)

  // ── Painel de histórico (sidebar esquerda no chat) ────────
  const [showHistory, setShowHistory] = useState(true)
  const [histSearch, setHistSearch] = useState('')

  // ── Painel de artifact (direita no chat) ──────────────────
  const [artifactOpen, setArtifactOpen] = useState(false)
  const [artifactContent, setArtifactContent] = useState('')
  const [artifactTitle, setArtifactTitle] = useState('')
  const [artifactCopied, setArtifactCopied] = useState(false)
  const [artifactFull, setArtifactFull] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  // ── Inicializa com conversa do agente padrão ──────────────
  useEffect(() => {
    const defaultAgent = AGENTS.find(a => a.id === DEFAULT_AGENT_ID) || AGENTS[0]
    if (!defaultAgent) return
    openAgent(defaultAgent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reage ao agente selecionado via sidebar ───────────────
  useEffect(() => {
    if (!pendingAgentId) return
    const agent = AGENTS.find(a => a.id === pendingAgentId)
    if (agent) {
      openAgent(agent)
      onAgentOpened?.(agent.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAgentId])

  useEffect(() => { if (conversations.length) saveConvs(conversations) }, [conversations])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConv?.messages])
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  // ── Abrir agente ──────────────────────────────────────────
  const openAgent = useCallback((agent: Agent) => {
    const convId = `conv-${Date.now()}`
    const conv: Conversation = {
      id: convId, title: `${agent.emoji} ${agent.shortName}`,
      agentId: agent.id, agentName: agent.name, agentEmoji: agent.emoji,
      messages: [], createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), starred: false,
    }
    setConversations(prev => [conv, ...prev])
    setSelectedAgent(agent)
    setActiveConvId(convId)
    setArtifactOpen(false)
    setInput('')
    setTimeout(() => textareaRef.current?.focus(), 150)
  }, [])

  const openConv = useCallback((conv: Conversation) => {
    const agent = AGENTS.find(a => a.id === conv.agentId)
    if (agent) setSelectedAgent(agent)
    setActiveConvId(conv.id)
  }, [])

  // ── Enviar mensagem ───────────────────────────────────────
  const sendMessage = useCallback(async (overrideInput?: string) => {
    const msg = overrideInput || input
    if (!msg.trim() || loading || !selectedAgent || !activeConvId) return

    const userMsg: Message = {
      id: `u-${Date.now()}`, role: 'user',
      content: msg + (attachment ? `\n\n📎 **${attachment.name}:**\n${attachment.text}` : ''),
      timestamp: new Date().toISOString(),
    }
    const loadingMsg: Message = {
      id: `l-${Date.now()}`, role: 'assistant', content: '',
      timestamp: new Date().toISOString(), isLoading: true, agentId: selectedAgent.id,
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...c.messages, userMsg, loadingMsg], updatedAt: new Date().toISOString() }
        : c
    ))
    setInput('')
    setAttachment(null)
    setLoading(true)

    const start = Date.now()
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: msg + (attachment ? `\n\nDocumento: ${attachment.name}\n${attachment.text}` : ''),
          useSearch,
          context: { source: 'ecosystem-workspace-v2' },
        }),
      })
      const data = await res.json()
      const elapsed = Date.now() - start
      const content = data.success ? (data.output || data.resposta || '') : `❌ ${data.error || 'Erro'}`

      const assistantMsg: Message = {
        id: `a-${Date.now()}`, role: 'assistant', content,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed, elapsed_ms: elapsed, agentId: selectedAgent.id,
      }

      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), assistantMsg] }
          : c
      ))

      if (data.success && shouldOpenArtifact(content)) {
        setArtifactContent(content)
        setArtifactTitle(`${selectedAgent.emoji} ${selectedAgent.shortName}`)
        setArtifactOpen(true)
      }

    } catch {
      const errMsg: Message = {
        id: `e-${Date.now()}`, role: 'assistant',
        content: '❌ Erro de conexão. Tente novamente.',
        timestamp: new Date().toISOString(),
      }
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: [...c.messages.filter(m => !m.isLoading), errMsg] }
          : c
      ))
    } finally {
      setLoading(false)
    }
  }, [input, loading, selectedAgent, activeConvId, useSearch, attachment])

  // ── Copiar artifact ────────────────────────────────────────
  const copyArtifact = () => {
    navigator.clipboard.writeText(artifactContent)
    setArtifactCopied(true)
    setTimeout(() => setArtifactCopied(false), 2000)
  }

  // ── Download artifact ──────────────────────────────────────
  const downloadArtifact = () => {
    const blob = new Blob([artifactContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifactTitle.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Upload arquivo ─────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const raw = ev.target?.result as string
      try {
        const bin = atob(raw.split(',')[1] || raw)
        const text = (bin.match(/[\x20-\x7E]{4,}/g) || []).join('\n').slice(0, 12000)
        setAttachment({ name: file.name, text: text || `[${file.name}]` })
      } catch {
        setAttachment({ name: file.name, text: `[${file.name} - ${file.size} bytes]` })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Histórico filtrado ─────────────────────────────────────
  const filteredHistory = conversations
    .filter(c => c.messages.filter(m => !m.isLoading).length > 0)
    .filter(c => !histSearch || c.title.toLowerCase().includes(histSearch.toLowerCase()))
    .slice(0, 40)

  // ─── Agentes disponíveis agrupados por categoria (para seleção rápida no chat) ──
  const categoryLabel: Record<string, string> = {
    juridico: 'Jurídico', contador: 'Contador',
    perito: 'Perito', marketing: 'Growth',
    atendimento: 'Atendimento', sistema: 'Sistema',
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: CHAT (interface única — sem tela home)
  // ═══════════════════════════════════════════════════════════
  const messages = activeConv?.messages || []

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F8F9FA' }}>

      {/* ── Sidebar esquerda: histórico de conversas ─────────── */}
      {showHistory && (
        <div className="w-60 flex-shrink-0 flex flex-col border-r"
          style={{ background: '#FFFFFF', borderColor: '#EEEEEE' }}>

          {/* Topo da sidebar de histórico */}
          <div className="p-3 border-b" style={{ borderColor: '#F0F0F0' }}>
            {/* Logo/contexto do agente atual */}
            {selectedAgent && (
              <div className="flex items-center gap-2.5 mb-3 px-2 py-2 rounded-xl"
                style={{ background: selectedAgent.accentColor }}>
                <span className="text-xl">{selectedAgent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: selectedAgent.color }}>
                    {selectedAgent.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                    {selectedAgent.model}
                  </p>
                </div>
              </div>
            )}

            {/* Busca no histórico */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <input value={histSearch} onChange={e => setHistSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full pl-8 pr-3 py-2 rounded-lg text-xs border focus:outline-none"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#222' }} />
            </div>

            {/* Botão nova conversa com agente atual */}
            <button
              onClick={() => selectedAgent && openAgent(selectedAgent)}
              className="w-full flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-gray-50"
              style={{ color: '#0f2044', border: '1.5px solid #E5E7EB' }}>
              <Plus className="w-3.5 h-3.5" />
              Nova conversa
            </button>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredHistory.length === 0 && (
              <div className="text-center py-10">
                <Sparkles className="w-6 h-6 mx-auto mb-2" style={{ color: '#D1D5DB' }} />
                <p className="text-xs" style={{ color: '#D1D5DB' }}>Sem conversas ainda</p>
                <p className="text-xs mt-1" style={{ color: '#E5E7EB' }}>Selecione um agente no menu lateral</p>
              </div>
            )}
            {filteredHistory.map(c => (
              <button key={c.id}
                onClick={() => openConv(c)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group flex items-start gap-2 ${c.id === activeConvId ? 'ring-1' : 'hover:bg-gray-50'}`}
                style={c.id === activeConvId
                  ? { background: 'rgba(15,32,68,0.08)', color: '#0f2044' }
                  : { color: '#374151' }}>
                <span className="mt-0.5 flex-shrink-0">{c.agentEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.title}</p>
                  <p className="truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                    {c.messages.filter(m => !m.isLoading).length} msg
                  </p>
                </div>
                <button onClick={e => {
                  e.stopPropagation()
                  setConversations(prev => prev.filter(cv => cv.id !== c.id))
                  if (activeConvId === c.id) {
                    // Abrir default
                    const def = AGENTS.find(a => a.id === DEFAULT_AGENT_ID) || AGENTS[0]
                    if (def) openAgent(def)
                  }
                }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                  <Trash2 className="w-3 h-3" style={{ color: '#EF4444' }} />
                </button>
              </button>
            ))}
          </div>

          {/* Rodapé da sidebar com atalho de agentes */}
          <div className="p-3 border-t" style={{ borderColor: '#F0F0F0' }}>
            <p className="text-xs px-2 mb-2" style={{ color: '#9CA3AF' }}>
              💡 Selecione um agente no menu azul
            </p>
          </div>
        </div>
      )}

      {/* ── Painel central: chat ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{ background: '#FFFFFF', borderColor: '#EEEEEE' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title={showHistory ? 'Ocultar histórico' : 'Mostrar histórico'}>
              {showHistory
                ? <ChevronLeft className="w-4 h-4" style={{ color: '#6B7280' }} />
                : <LayoutGrid className="w-4 h-4" style={{ color: '#6B7280' }} />}
            </button>
            {selectedAgent && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: selectedAgent.accentColor }}>
                  {selectedAgent.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: '#0f2044' }}>{selectedAgent.name}</p>
                    {selectedAgent.premium && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: '#fef3c7', color: '#92400e' }}>⭐ Premium</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ModelBadge model={selectedAgent.model} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      · {categoryLabel[selectedAgent.category] || selectedAgent.category}
                      · {messages.filter(m => m.role === 'user').length} consultas
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-2">
            <button onClick={() => selectedAgent && openAgent(selectedAgent)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
              style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>
              <Plus className="w-3.5 h-3.5" /> Nova
            </button>
            <button
              onClick={() => {
                if (artifactOpen) { setArtifactOpen(false) } else {
                  const last = [...messages].reverse().find(m => m.role === 'assistant' && m.content.length > 100)
                  if (last) { setArtifactContent(last.content); setArtifactTitle(selectedAgent?.shortName || 'Resposta'); setArtifactOpen(true) }
                }
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors"
              style={{
                color: artifactOpen ? '#0f2044' : '#6B7280',
                borderColor: artifactOpen ? '#0f2044' : '#E5E7EB',
                background: artifactOpen ? 'rgba(15,32,68,0.06)' : '',
              }}>
              {artifactOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
              {artifactOpen ? 'Fechar painel' : 'Painel'}
            </button>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {messages.length === 0 && selectedAgent && (
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ background: selectedAgent.accentColor }}>
                {selectedAgent.emoji}
              </div>
              <h2 className="text-base font-bold mb-1" style={{ color: '#0f2044' }}>{selectedAgent.name}</h2>
              <p className="text-sm mb-1" style={{ color: '#6B7280' }}>{selectedAgent.description}</p>
              <div className="flex justify-center mb-6">
                <ModelBadge model={selectedAgent.model} />
              </div>
              <div className="grid grid-cols-1 gap-2 text-left">
                {[
                  'Faça uma pergunta em linguagem natural',
                  'Solicite uma peça processual com os dados do caso',
                  'Envie um documento PDF para análise',
                ].map((s, i) => (
                  <button key={i} onClick={() => setInput(s)}
                    className="text-left text-xs px-4 py-3 rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all"
                    style={{ background: '#F9FAFB', borderColor: '#E5E7EB', color: '#555' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mr-2.5 mt-0.5"
                  style={{ background: selectedAgent?.accentColor || '#F3F4F6' }}>
                  {selectedAgent?.emoji || '⚖️'}
                </div>
              )}
              <div className="max-w-[82%]">
                {msg.isLoading ? (
                  <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                    style={{ background: '#FFFFFF', border: '1px solid #EEEEEE', borderRadius: '20px 20px 20px 4px' }}>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: '#D4A017', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                    <span className="text-sm" style={{ color: '#6B7280' }}>
                      {selectedAgent?.shortName} processando...
                    </span>
                  </div>
                ) : (
                  <div className="group relative">
                    <div className="px-5 py-4 rounded-2xl"
                      style={msg.role === 'user'
                        ? { background: '#0f2044', color: '#FFFFFF', borderRadius: '20px 20px 4px 20px' }
                        : { background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #EEEEEE', borderRadius: '20px 20px 20px 4px' }}>
                      {msg.role === 'user'
                        ? <div className="text-sm whitespace-pre-wrap" style={{ color: '#FFFFFF', lineHeight: '1.7' }}>{msg.content}</div>
                        : <MarkdownContent content={msg.content} />
                      }
                    </div>

                    {/* Metadados + ações */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between mt-1.5 px-1">
                        <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
                          {msg.modelUsed && <ModelBadge model={msg.modelUsed} />}
                          {msg.elapsed_ms && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtTime(msg.elapsed_ms)}</span>}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Copiar">
                            <Copy className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                          </button>
                          {msg.content.length > 400 && (
                            <button onClick={() => {
                              setArtifactContent(msg.content)
                              setArtifactTitle(selectedAgent?.shortName || 'Resposta')
                              setArtifactOpen(true)
                            }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Abrir no painel">
                              <PanelRight className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                            </button>
                          )}
                          <button onClick={() => {
                            const b = new Blob([msg.content], { type: 'text/plain' })
                            const u = URL.createObjectURL(b)
                            const a = document.createElement('a')
                            a.href = u; a.download = `ben-${Date.now()}.txt`; a.click()
                          }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Baixar">
                            <Download className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ background: '#FFFFFF', borderColor: '#EEEEEE' }}>

          {/* Anexo */}
          {attachment && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: '#F0F4FF', border: '1px solid #C7D2FE' }}>
              <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4F46E5' }} />
              <span className="flex-1 truncate font-medium" style={{ color: '#3730A3' }}>{attachment.name}</span>
              <button onClick={() => setAttachment(null)}>
                <X className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
              </button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1 relative rounded-2xl border focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all"
              style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={`Mensagem para ${selectedAgent?.shortName || 'agente'}... (Enter para enviar)`}
                rows={1}
                disabled={loading}
                className="w-full px-4 py-3 text-sm bg-transparent resize-none focus:outline-none pr-24"
                style={{ color: '#222', minHeight: '48px', maxHeight: '160px', lineHeight: '1.5' }}
              />
              <div className="absolute right-3 bottom-2.5 flex items-center gap-1.5">
                <button onClick={() => fileRef.current?.click()}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors" title="Anexar documento">
                  <Paperclip className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                </button>
                <button onClick={() => setUseSearch(!useSearch)}
                  className="p-1.5 rounded-lg transition-colors" title="Pesquisa web"
                  style={{ background: useSearch ? 'rgba(15,32,68,0.1)' : '' }}>
                  <Globe className="w-4 h-4" style={{ color: useSearch ? '#0f2044' : '#9CA3AF' }} />
                </button>
              </div>
            </div>

            <button onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: loading ? '#6B7280' : '#0f2044' }}>
              {loading
                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                : <Send className="w-5 h-5 text-white" />}
            </button>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#9CA3AF' }}>
            <span>Enter envia · Shift+Enter nova linha</span>
            {useSearch && <span className="flex items-center gap-1 text-blue-600"><Globe className="w-3 h-3" /> Pesquisa web ativa</span>}
            {attachment && <span className="text-indigo-600">📎 {attachment.name}</span>}
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFile} />
      </div>

      {/* ── Painel lateral direito: ARTIFACT ─────────────────── */}
      {artifactOpen && (
        <div className={`flex-shrink-0 flex flex-col border-l transition-all duration-300 ${artifactFull ? 'fixed inset-0 z-50' : 'w-[45%] min-w-[400px] max-w-[700px]'}`}
          style={{ background: '#FFFFFF', borderColor: '#EEEEEE' }}>

          {/* Artifact header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ background: '#0f2044', borderColor: '#1a3060' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(212,160,23,0.25)' }}>
                <FileText className="w-4 h-4" style={{ color: '#D4A017' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{artifactTitle}</p>
                <p className="text-xs" style={{ color: '#6b7aaa' }}>
                  {artifactContent.split(/\s+/).length} palavras · {artifactContent.length} chars
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={copyArtifact}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: artifactCopied ? '#4ade80' : '#CBD5E1' }}>
                {artifactCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {artifactCopied ? 'Copiado!' : 'Copiar'}
              </button>
              <button onClick={downloadArtifact}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                <Download className="w-3.5 h-3.5" /> .txt
              </button>
              <button onClick={() => setArtifactFull(!artifactFull)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: '#CBD5E1' }}>
                {artifactFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setArtifactOpen(false)}
                className="p-1.5 rounded-lg transition-colors" style={{ color: '#CBD5E1' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Artifact content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <MarkdownContent content={artifactContent} />
          </div>

          {/* Artifact footer */}
          <div className="px-5 py-3 border-t flex items-center justify-between"
            style={{ borderColor: '#F0F0F0', background: '#FAFBFC' }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              ⚠️ Minuta — revisão obrigatória pelo Dr. Mauro Monção
            </span>
            <div className="flex gap-2">
              <button onClick={copyArtifact}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                style={{ background: '#0f2044', color: '#D4A017' }}>
                {artifactCopied ? '✓ Copiado' : 'Copiar tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
