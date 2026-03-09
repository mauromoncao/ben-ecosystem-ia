import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Paperclip, FileText, Globe, Mic, Camera,
  Mail, HardDrive, Link2, Download, Copy, Check,
  X, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Zap, TrendingUp, Plus, Trash2,
  History, FileDown, BookOpen, Shield, Search,
  Edit3, Star, AlertCircle, User, LogOut,
  BarChart3, Clock, Filter, ChevronDown, ChevronUp,
  Activity, Wifi, WifiOff, Info
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ─── Tipos ────────────────────────────────────────────────────
type Project       = 'growth' | 'juris'
type AgentCategory = 'atendimento' | 'juridico' | 'marketing' | 'sistema' | 'contador' | 'perito'
type ModuleStatus  = 'online' | 'offline' | 'degraded' | 'checking'

interface Agent {
  id: string; name: string; emoji: string; description: string
  model: string; modelBadge: string; category: AgentCategory
  project: Project | 'both'; color: string; active: boolean
}
interface Attachment {
  id: string; name: string; type: string; size: number; base64?: string
}
interface Message {
  id: string; role: 'user' | 'assistant'; content: string
  agentId?: string; agentName?: string; timestamp: string
  attachments?: Attachment[]; isLoading?: boolean
  modelUsed?: string; destino?: string; elapsed_ms?: number
}
interface Conversation {
  id: string; title: string; agentId: string; agentName: string; agentEmoji: string
  messages: Message[]; createdAt: string; updatedAt: string; project: Project | 'both'
  starred?: boolean; tags?: string[]
}
interface EcosystemStatus {
  growth: ModuleStatus; juris: ModuleStatus; vps: ModuleStatus; lastCheck?: string
}
// Item 3: tipos do monitor
interface MonitorStats {
  totalCalls: number; dailyCostUsd: number; monthlyCostUsd: number
  totalTokens: number; alertas: { level: string; msg: string }[]
}

// ─── Permissões por perfil ────────────────────────────────────
const ADMIN_EMAILS = ['mauromoncaoestudos@gmail.com', 'mauromoncaoadv.escritorio@gmail.com']
const RESTRICTED_AGENTS = ['ben-perito-forense-profundo', 'ben-engenheiro-prompt']

// ─── Agentes ──────────────────────────────────────────────────
const ECOSYSTEM_AGENTS: Agent[] = [
  { id: 'ben-conteudista',            name: 'BEN Conteudista Jurídico',       emoji: '✍️', description: 'Artigos jurídicos, posts e conteúdo institucional OAB-compliant.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'marketing',   project: 'growth', color: '#7c3aed', active: true },
  { id: 'ben-estrategista-campanhas', name: 'BEN Estrategista Campanhas',     emoji: '📊', description: 'Análise de performance Meta Ads e Google Ads. ROI e KPIs.', model: 'GPT-4o',    modelBadge: 'bg-blue-100 text-blue-800',    category: 'marketing',   project: 'growth', color: '#059669', active: true },
  { id: 'ben-analista-relatorios',    name: 'BEN Analista de Relatórios',     emoji: '📈', description: 'Relatório semanal com insights de performance e métricas.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'marketing', project: 'growth', color: '#d97706', active: true },
  { id: 'ben-analista-monitoramento', name: 'BEN Analista Monitoramento',     emoji: '🔍', description: 'Monitoramento de saúde do sistema e alertas críticos.', model: 'GPT-4o Mini',   modelBadge: 'bg-blue-100 text-blue-800',    category: 'sistema',     project: 'growth', color: '#dc2626', active: true },
  { id: 'ben-estrategista-marketing', name: 'BEN Estrategista Marketing',     emoji: '📣', description: 'Redes sociais, Instagram, Reels e conteúdo OAB-compliant.', model: 'GPT-4o',    modelBadge: 'bg-blue-100 text-blue-800',    category: 'marketing',   project: 'growth', color: '#0369a1', active: true },
  { id: 'ben-diretor-criativo',       name: 'BEN Diretor Criativo',           emoji: '🎨', description: 'Identidade visual, branding jurídico e direção criativa.', model: 'GPT-4o',      modelBadge: 'bg-blue-100 text-blue-800',    category: 'marketing',   project: 'growth', color: '#7c3aed', active: true },
  { id: 'ben-revisor-juridico',       name: 'BEN Revisor Jurídico',           emoji: '📝', description: 'Revisão técnica e linguística de peças jurídicas.', model: 'Claude Haiku 4.5',  modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'growth', color: '#374151', active: true },
  { id: 'ben-peticionista',           name: 'BEN Peticionista',               emoji: '⚖️', description: 'Petições iniciais, recursos e peças de urgência do Growth.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'growth', color: '#1d4ed8', active: true },
  { id: 'ben-super-agente-juridico',  name: 'BEN Super Agente Jurídico ⭐',   emoji: '🌟', description: 'Coordenação estratégica multidisciplinar — o mais poderoso.', model: 'Claude Opus 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'juridico', project: 'juris', color: '#92400e', active: true },
  { id: 'ben-peticionista-juridico',  name: 'BEN Peticionista Jurídico',      emoji: '⚖️', description: 'Peças processuais conforme o caso concreto e jurisprudência.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#1d4ed8', active: true },
  { id: 'ben-contratualista',         name: 'BEN Contratualista',             emoji: '📋', description: 'Contratos empresariais, NDAs, societários e documentos negociais.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-mandatario-juridico',    name: 'BEN Mandatário Jurídico',        emoji: '📜', description: 'Procurações Ad Judicia, gerais, especiais e substabelecimentos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#059669', active: true },
  { id: 'ben-analista-processual',    name: 'BEN Analista Processual',        emoji: '🔬', description: 'Análise estratégica de processos com avaliação de risco.', model: 'GPT-4o',      modelBadge: 'bg-blue-100 text-blue-800',    category: 'juridico',    project: 'juris', color: '#dc2626', active: true },
  { id: 'ben-auditor-processual',     name: 'BEN Auditor Processual',         emoji: '🔏', description: 'Auditoria de prazos críticos, conformidade OAB e gestão de risco.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#0f766e', active: true },
  { id: 'ben-gestor-juridico',        name: 'BEN Gestor Jurídico',            emoji: '🏢', description: 'Gestão de escritório, produtividade jurídica e governança.', model: 'GPT-4o',     modelBadge: 'bg-blue-100 text-blue-800',    category: 'juridico',    project: 'juris', color: '#374151', active: true },
  { id: 'ben-tributarista',           name: 'BEN Tributarista',               emoji: '💰', description: 'Direito tributário, planejamento fiscal e teses avançadas.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#d97706', active: true },
  { id: 'ben-trabalhista',            name: 'BEN Trabalhista',                emoji: '👷', description: 'Direito do trabalho, TST, reclamações e acordos trabalhistas.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800',    category: 'juridico',    project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-previdenciarista',       name: 'BEN Previdenciarista',           emoji: '🏛️', description: 'Benefícios INSS, aposentadorias e revisões previdenciárias.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-pesquisador-juridico',   name: 'BEN Pesquisador Jurídico',       emoji: '🔎', description: 'Pesquisa em tempo real: STF, STJ, TRF, TJPI com citações.', model: 'Perplexity llama-3.1', modelBadge: 'bg-indigo-100 text-indigo-800', category: 'juridico', project: 'juris', color: '#6d28d9', active: true },
  { id: 'ben-especialista-compliance',name: 'BEN Especialista Compliance',    emoji: '🛡️', description: 'Conformidade LGPD, políticas de privacidade e proteção de dados.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico',    project: 'juris', color: '#0f766e', active: true },
  { id: 'ben-relator-juridico',       name: 'BEN Relator Jurídico',           emoji: '📚', description: 'Artigos jurídicos, pareceres técnicos e publicações institucionais.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico',  project: 'juris', color: '#1e40af', active: true },
  { id: 'ben-redator-juridico',       name: 'BEN Redator Jurídico',           emoji: '✒️', description: 'Redação técnica jurídica, memorandos, ofícios e comunicações.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico',      project: 'juris', color: '#374151', active: true },
  { id: 'ben-constitucionalista',     name: 'BEN Constitucionalista',         emoji: '⚡', description: 'MS, HC, Mandado de Injunção, ações constitucionais e STF.', model: 'GPT-4o',      modelBadge: 'bg-blue-100 text-blue-800',    category: 'juridico',    project: 'juris', color: '#b91c1c', active: true },
  { id: 'ben-engenheiro-prompt',      name: 'BEN Engenheiro de Prompt',       emoji: '🧠', description: 'Otimização de prompts, configuração de agentes e arquitetura IA.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'sistema',      project: 'juris', color: '#4f46e5', active: true },
  { id: 'ben-contador-tributarista',             name: 'BEN Contador — Triagem',      emoji: '🧮', description: 'Triagem fiscal: classifica e encaminha ao especialista correto.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#92400e', active: true },
  { id: 'ben-contador-tributarista-especialista',name: 'BEN Contador — Especialista', emoji: '📊', description: 'Análise fiscal profunda — planejamento tributário avançado.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'contador', project: 'juris', color: '#b45309', active: true },
  { id: 'ben-contador-tributarista-planejamento',name: 'BEN Contador — Planejamento', emoji: '🗺️', description: 'Planejamento tributário estratégico e otimização de carga.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'contador', project: 'juris', color: '#d97706', active: true },
  { id: 'ben-contador-tributarista-creditos',    name: 'BEN Contador — Créditos',     emoji: '💳', description: 'Recuperação de créditos tributários e compensações.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#059669', active: true },
  { id: 'ben-contador-tributarista-auditoria',   name: 'BEN Contador — Auditoria',    emoji: '🔍', description: 'Auditoria fiscal, conformidade tributária e gestão de risco.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#dc2626', active: true },
  { id: 'ben-contador-tributarista-relatorio',   name: 'BEN Contador — Relatório',    emoji: '📋', description: 'Relatórios fiscais executivos e dashboards tributários.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-perito-forense',          name: 'BEN Perito Forense — Padrão',   emoji: '🔬', description: 'Análise pericial padrão — laudos e pareceres técnicos.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'perito', project: 'juris', color: '#4f46e5', active: true },
  { id: 'ben-perito-forense-profundo', name: 'BEN Perito Forense — Profundo ⚠️', emoji: '🧬', description: 'Análise pericial profunda — alto custo, máxima precisão.', model: 'Claude Opus 4.6', modelBadge: 'bg-red-100 text-red-800', category: 'perito', project: 'juris', color: '#b91c1c', active: true },
  { id: 'ben-perito-forense-digital',  name: 'BEN Perito Forense Digital',    emoji: '💻', description: 'Perícia digital e análise de evidências eletrônicas.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'perito', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-perito-forense-laudo',    name: 'BEN Perito Forense — Laudo',    emoji: '📄', description: 'Elaboração de laudos periciais técnicos para processos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-perito-forense-contestar',name: 'BEN Perito — Contraditório',    emoji: '🛡️', description: 'Contestação de laudos adversariais e quesitos técnicos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#059669', active: true },
  { id: 'ben-perito-forense-relatorio',name: 'BEN Perito Forense — Relatório',emoji: '📊', description: 'Relatórios periciais executivos e sínteses técnicas.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#374151', active: true },
]

const ATTACH_OPTIONS = [
  { id: 'file',  icon: <FileText  className="w-4 h-4"/>, label: 'Documento',   sub: 'PDF, Word, TXT, Excel',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { id: 'image', icon: <Camera    className="w-4 h-4"/>, label: 'Imagem/Foto', sub: 'JPG, PNG, WebP',          color: 'text-green-600',  bg: 'bg-green-50'  },
  { id: 'email', icon: <Mail      className="w-4 h-4"/>, label: 'E-mail',       sub: 'Importar .eml',           color: 'text-red-500',    bg: 'bg-red-50'    },
  { id: 'drive', icon: <HardDrive className="w-4 h-4"/>, label: 'Google Drive', sub: 'Conectar Drive',          color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'url',   icon: <Link2     className="w-4 h-4"/>, label: 'Link / URL',   sub: 'Página web ou doc',       color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'audio', icon: <Mic       className="w-4 h-4"/>, label: 'Áudio',        sub: 'MP3, M4A, transcrição',   color: 'text-pink-600',   bg: 'bg-pink-50'   },
]

// ─── Storage helpers ─────────────────────────────────────────
const STORAGE_KEY   = 'ben_ecosystem_conversations'
const SESSION_KEY   = 'ben_ecosystem_session'
const MAX_STORED    = 50

function loadConversations(): Conversation[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveConversations(convs: Conversation[]) {
  try {
    const clean = convs.slice(0, MAX_STORED).map(c => ({
      ...c, messages: c.messages.filter(m => !m.isLoading)
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  } catch { /* quota */ }
}

// ─── Session helpers (Item 4 — expiração 8h) ────────────────
const SESSION_DURATION = 8 * 60 * 60 * 1000
function refreshSession() { localStorage.setItem(SESSION_KEY, JSON.stringify(Date.now() + SESSION_DURATION)) }
function isSessionValid(): boolean {
  try { const exp = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return exp !== null && Date.now() < exp } catch { return false }
}

function StatusDot({ status }: { status: ModuleStatus }) {
  const map: Record<ModuleStatus, string> = {
    online: 'bg-green-500', offline: 'bg-red-500',
    degraded: 'bg-yellow-400', checking: 'bg-gray-400 animate-pulse',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`}/>
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function EcosystemWorkspace() {
  const { user, logout } = useAuth()

  // ── Item 4: perfil admin ──────────────────────────────────
  const isAdmin = ADMIN_EMAILS.includes(user?.email || '')

  // ── Item 1: histórico persistido ─────────────────────────
  const [conversations,   setConversations]   = useState<Conversation[]>(() => loadConversations())
  const [activeConvId,    setActiveConvId]     = useState<string | null>(null)
  const [historySearch,   setHistorySearch]    = useState('')
  const [editingTitle,    setEditingTitle]     = useState<string | null>(null)
  const [editTitleVal,    setEditTitleVal]     = useState('')
  const [historyFilter,   setHistoryFilter]    = useState<'all' | 'starred'>('all')

  const [selectedAgent,   setSelectedAgent]   = useState<Agent | null>(null)
  const [prompt,          setPrompt]           = useState('')
  const [attachments,     setAttachments]      = useState<Attachment[]>([])
  const [isLoading,       setIsLoading]        = useState(false)
  const [copiedMsgId,     setCopiedMsgId]      = useState<string | null>(null)
  const [attachMenuOpen,  setAttachMenuOpen]   = useState(false)
  const [urlInput,        setUrlInput]         = useState('')
  const [showUrlInput,    setShowUrlInput]     = useState(false)
  const [useSearch,       setUseSearch]        = useState(false)
  const [letterheadMode,  setLetterheadMode]   = useState(false)
  const [filterProject,   setFilterProject]    = useState<'all' | 'growth' | 'juris'>('all')
  const [carouselIdx,     setCarouselIdx]      = useState(0)
  const [showHistory,     setShowHistory]      = useState(false)

  // ── Item 2: status dos sistemas ──────────────────────────
  const [ecoStatus,       setEcoStatus]        = useState<EcosystemStatus>({
    growth: 'checking', juris: 'checking', vps: 'checking',
  })
  const [retryCount,      setRetryCount]       = useState<Record<string, number>>({})

  // ── Item 3: monitor inline ────────────────────────────────
  const [showMonitor,     setShowMonitor]      = useState(false)
  const [monitorStats,    setMonitorStats]     = useState<MonitorStats | null>(null)
  const [monitorLoading,  setMonitorLoading]   = useState(false)

  // ── Item 4: painel de perfil ──────────────────────────────
  const [showProfile,     setShowProfile]      = useState(false)

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)
  const histSearchRef = useRef<HTMLInputElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  // ── Item 4: verificar sessão a cada 5min ─────────────────
  useEffect(() => {
    refreshSession()
    const iv = setInterval(() => {
      if (!isSessionValid()) logout()
      else refreshSession()
    }, 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [logout])

  // ── Item 1: persistir no localStorage ───────────────────
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  // ── Item 2: status dos sistemas ─────────────────────────
  const checkStatus = useCallback(async () => {
    setEcoStatus(prev => ({ ...prev, growth: 'checking', juris: 'checking', vps: 'checking' }))
    try {
      const r = await fetch('/api/bridge?action=status', { signal: AbortSignal.timeout(10000) })
      if (r.ok) {
        const d = await r.json()
        setEcoStatus({
          growth:    d.modulos?.growth?.status || 'offline',
          juris:     d.modulos?.juris?.status  || 'offline',
          vps:       d.modulos?.vps?.status    || 'offline',
          lastCheck: new Date().toLocaleTimeString('pt-BR'),
        })
        return
      }
    } catch { /* silent */ }
    setEcoStatus({ growth: 'offline', juris: 'offline', vps: 'offline' })
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  // ── Item 3: carregar estatísticas do monitor ─────────────
  const loadMonitorStats = useCallback(async () => {
    if (!isAdmin) return
    setMonitorLoading(true)
    try {
      const token = 'ben_monitor_mauro_2026_secure'
      const r = await fetch(`/api/monitor?action=stats&token=${encodeURIComponent(token)}`, {
        signal: AbortSignal.timeout(8000)
      })
      if (r.ok) {
        const d = await r.json()
        setMonitorStats({
          totalCalls:    d.summary?.totalCalls    || 0,
          dailyCostUsd:  d.summary?.dailyCostUsd  || 0,
          monthlyCostUsd: d.summary?.monthlyCostUsd || 0,
          totalTokens:   (d.summary?.totalInputTokens || 0) + (d.summary?.totalOutputTokens || 0),
          alertas:       d.summary?.alertas       || [],
        })
      }
    } catch { /* silent */ }
    finally { setMonitorLoading(false) }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) loadMonitorStats()
  }, [isAdmin, loadMonitorStats])

  // Click outside handler
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false); setShowUrlInput(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [prompt])

  // ── Carrossel — Item 4: filtrar restritos ───────────────
  const visibleToUser = ECOSYSTEM_AGENTS.filter(a =>
    isAdmin ? true : !RESTRICTED_AGENTS.includes(a.id)
  )
  const filteredAgents = visibleToUser.filter(a =>
    filterProject === 'all' || a.project === filterProject
  )
  const CARDS = 4
  const totalSlides = Math.ceil(filteredAgents.length / CARDS)
  const visibleAgents = filteredAgents.slice(carouselIdx * CARDS, (carouselIdx + 1) * CARDS)

  // ── Item 2: status por sistema para badge nos cards ──────
  const agentStatus = useCallback((agent: Agent): ModuleStatus => {
    if (agent.project === 'growth') return ecoStatus.growth
    if (agent.project === 'juris')  return ecoStatus.juris
    return 'online'
  }, [ecoStatus])

  // ── Item 1: filtrar histórico por busca + estrela ────────
  const filteredHistory = conversations
    .filter(c => c.messages.filter(m => !m.isLoading).length > 0)
    .filter(c => {
      if (historyFilter === 'starred' && !c.starred) return false
      if (!historySearch.trim()) return true
      const q = historySearch.toLowerCase()
      return c.title.toLowerCase().includes(q)
        || c.agentName.toLowerCase().includes(q)
        || c.messages.some(m => m.content.toLowerCase().includes(q))
    })
    .slice(0, 30)

  // ── Selecionar agente ─────────────────────────────────────
  const selectAgent = useCallback((agent: Agent) => {
    if (!isAdmin && RESTRICTED_AGENTS.includes(agent.id)) return
    const existingEmpty = conversations.find(c => c.agentId === agent.id && c.messages.length === 0)
    if (existingEmpty) {
      setSelectedAgent(agent); setActiveConvId(existingEmpty.id)
      setTimeout(() => textareaRef.current?.focus(), 100)
      return
    }
    const newId = `conv-${Date.now()}`
    const newConv: Conversation = {
      id: newId, title: `${agent.emoji} ${agent.name}`,
      agentId: agent.id, agentName: agent.name, agentEmoji: agent.emoji,
      messages: [], createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), project: agent.project,
      starred: false, tags: [],
    }
    setConversations(prev => [newConv, ...prev])
    setSelectedAgent(agent); setActiveConvId(newId)
    setPrompt(''); setAttachments([])
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [conversations, isAdmin])

  // ── Item 1: abrir conversa do histórico ─────────────────
  const openConversation = useCallback((conv: Conversation) => {
    const agent = ECOSYSTEM_AGENTS.find(a => a.id === conv.agentId)
    if (agent) setSelectedAgent(agent)
    setActiveConvId(conv.id)
    setShowHistory(false)
  }, [])

  // ── Item 1: deletar conversa ──────────────────────────────
  const deleteConversation = useCallback((convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (activeConvId === convId) { setActiveConvId(null); setSelectedAgent(null) }
  }, [activeConvId])

  // ── Item 1: marcar estrela (favorito) ───────────────────
  const toggleStar = useCallback((convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => prev.map(c =>
      c.id === convId ? { ...c, starred: !c.starred } : c
    ))
  }, [])

  // ── Item 1: renomear conversa ────────────────────────────
  const startRename = useCallback((conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTitle(conv.id)
    setEditTitleVal(conv.title)
  }, [])

  const confirmRename = useCallback((convId: string) => {
    if (editTitleVal.trim()) {
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, title: editTitleVal.trim() } : c
      ))
    }
    setEditingTitle(null)
  }, [editTitleVal])

  // ── Item 1: limpar histórico ─────────────────────────────
  const clearHistory = useCallback(() => {
    if (!window.confirm('Apagar todo o histórico de conversas?')) return
    setConversations([]); setActiveConvId(null); setSelectedAgent(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // ── Upload ────────────────────────────────────────────────
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => setAttachments(prev => [...prev, {
        id: `att-${Date.now()}-${Math.random()}`,
        name: file.name, type: file.type, size: file.size,
        base64: e.target?.result as string,
      }])
      reader.readAsDataURL(file)
    })
  }, [])

  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    setAttachments(prev => [...prev, { id: `url-${Date.now()}`, name: urlInput.trim(), type: 'text/url', size: 0 }])
    setUrlInput(''); setShowUrlInput(false); setAttachMenuOpen(false)
  }

  const handleAttachOption = (id: string) => {
    if (id === 'file')  { fileInputRef.current?.click();  setAttachMenuOpen(false) }
    if (id === 'image') { imageInputRef.current?.click(); setAttachMenuOpen(false) }
    if (id === 'audio') { audioInputRef.current?.click(); setAttachMenuOpen(false) }
    if (id === 'url')   { setShowUrlInput(true) }
    if (id === 'email') { fileInputRef.current?.click();  setAttachMenuOpen(false) }
    if (id === 'drive') { window.open('https://drive.google.com', '_blank'); setAttachMenuOpen(false) }
  }

  // ── Item 2: enviar mensagem com retry ────────────────────
  const sendMessage = useCallback(async () => {
    const text = prompt.trim()
    if (!text || !selectedAgent || !activeConvId) return

    const attachText = attachments.length > 0
      ? '\n\n[ARQUIVOS ANEXADOS]\n' + attachments.map(a =>
          a.type === 'text/url' ? `• URL: ${a.name}` : `• ${a.name} (${(a.size/1024).toFixed(1)} KB)`
        ).join('\n') : ''

    const fullPrompt = text + attachText
      + (letterheadMode ? '\n\n[INSTRUÇÃO: Usar timbre oficial — Mauro Monção Advogados, Parnaíba-PI e Fortaleza-CE, OAB/PI.]' : '')

    const userMsg: Message = {
      id: `msg-${Date.now()}`, role: 'user', content: text,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }
    const loadingMsg: Message = {
      id: `msg-loading-${Date.now()}`, role: 'assistant', content: '',
      agentId: selectedAgent.id, agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
      timestamp: new Date().toISOString(), isLoading: true,
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c,
            messages: [...c.messages, userMsg, loadingMsg],
            updatedAt: new Date().toISOString(),
            title: c.messages.length === 0 ? text.slice(0, 50) + (text.length > 50 ? '…' : '') : c.title,
          }
        : c
    ))
    setPrompt(''); setAttachments([]); setIsLoading(true)

    // Item 2: retry logic (até 2 tentativas)
    let attempts = 0; let lastError = ''
    while (attempts < 2) {
      attempts++
      try {
        const conv    = conversations.find(c => c.id === activeConvId)
        const history = (conv?.messages || []).filter(m => !m.isLoading).slice(-10)
          .map(m => ({ role: m.role, content: m.content }))

        const res = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: selectedAgent.id, input: fullPrompt,
            context: { history, letterhead: letterheadMode },
            useSearch: useSearch || selectedAgent.id === 'ben-pesquisador-juridico',
          }),
          signal: AbortSignal.timeout(65000),
        })

        let resultText = '', modelUsed = '', destino = '', elapsed = 0
        if (res.ok) {
          const d = await res.json()
          resultText = d.output || d.result || d.resposta || d.content || JSON.stringify(d)
          modelUsed  = d.modelUsed || d.model || ''
          destino    = d.destino || ''
          elapsed    = d.elapsed_ms || 0
          // Item 2: atualizar contagem de retry bem-sucedido
          setRetryCount(prev => ({ ...prev, [selectedAgent.id]: 0 }))
        } else {
          const err = await res.json().catch(() => ({}))
          // Item 2: se 503 (sistema indisponível), tenta retry
          if (res.status === 503 && attempts < 2) {
            await new Promise(r => setTimeout(r, 2000))
            continue
          }
          resultText = `⚠️ O agente **${selectedAgent.name}** está temporariamente indisponível (HTTP ${res.status}).\n\n${err.error || 'Verifique a configuração da API no Vercel.'}\n\n💡 **Dica:** Verifique o status dos sistemas no topo da tela.`
          setRetryCount(prev => ({ ...prev, [selectedAgent.id]: (prev[selectedAgent.id] || 0) + 1 }))
        }

        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? { ...c,
                updatedAt: new Date().toISOString(),
                messages: c.messages.filter(m => !m.isLoading).concat({
                  id: `msg-${Date.now()}`, role: 'assistant', content: resultText,
                  agentId: selectedAgent.id, agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
                  timestamp: new Date().toISOString(), modelUsed, destino, elapsed_ms: elapsed,
                }),
              }
            : c
        ))
        break // sucesso, sair do loop

      } catch (e: unknown) {
        lastError = e instanceof Error ? e.message : 'Erro desconhecido'
        if (attempts < 2) { await new Promise(r => setTimeout(r, 1500)); continue }
        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
                id: `msg-err-${Date.now()}`, role: 'assistant',
                content: `⚠️ Não foi possível conectar ao agente **${selectedAgent.name}** após ${attempts} tentativa(s).\n\nErro: ${lastError}\n\n💡 Verifique sua conexão e o status dos sistemas acima.`,
                agentId: selectedAgent.id, agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
                timestamp: new Date().toISOString(),
              }) }
            : c
        ))
      }
    }
    setIsLoading(false)
  }, [prompt, selectedAgent, activeConvId, attachments, conversations, useSearch, letterheadMode])

  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMsgId(msgId)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  // ── Item 1: Exportar como TXT ─────────────────────────────
  const exportTXT = useCallback((conv?: Conversation) => {
    const c = conv || activeConv
    if (!c) return
    const agent = ECOSYSTEM_AGENTS.find(a => a.id === c.agentId)
    const lines = [
      `BEN ECOSYSTEM IA — Conversa Exportada`,
      `Agente: ${agent?.emoji} ${c.agentName}`,
      `Data: ${new Date(c.createdAt).toLocaleString('pt-BR')}`,
      `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      `═══════════════════════════════════════`,
      '',
      ...c.messages.filter(m => !m.isLoading).map(m => [
        `[${m.role === 'user' ? 'DR. MAURO MONÇÃO' : c.agentName.toUpperCase()}] ${new Date(m.timestamp).toLocaleTimeString('pt-BR')}`,
        m.content,
        '',
      ]).flat(),
      '═══════════════════════════════════════',
      'Gerado por BEN ECOSYSTEM IA · Mauro Monção Advogados Associados',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `ben-${c.agentId}-${new Date(c.createdAt).toISOString().slice(0, 10)}.txt`
    a.click(); URL.revokeObjectURL(url)
  }, [activeConv])

  // ── Item 1: Exportar como PDF ─────────────────────────────
  const exportPDF = useCallback((conv?: Conversation) => {
    const c = conv || activeConv
    const agent = c ? ECOSYSTEM_AGENTS.find(a => a.id === c.agentId) || selectedAgent : selectedAgent
    if (!c || !agent) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const msgs = c.messages.filter(m => !m.isLoading)
    const html = `<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="utf-8"/>
      <title>BEN ${agent.name} — ${c.title}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 820px; margin: 0 auto; padding: 40px 24px; color: #222; background: #fff; }
        .header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #D4A017; padding-bottom: 16px; margin-bottom: 24px; }
        .header-icon { width: 44px; height: 44px; background: #0f2044; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .header-text h1 { color: #0f2044; font-size: 18px; margin: 0 0 2px; }
        .header-text p { color: #888; font-size: 11px; margin: 0; }
        .meta { display: flex; gap: 16px; background: #f8f9fa; border-radius: 8px; padding: 10px 14px; margin-bottom: 24px; font-size: 12px; color: #666; }
        .msg { margin-bottom: 20px; page-break-inside: avoid; }
        .label { font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
        .user-label { color: #0f2044; }
        .agent-label { color: #D4A017; }
        .content { padding: 14px 18px; border-radius: 10px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; border: 1px solid #e5e7eb; }
        .user-content { background: #0f2044; color: white; border-color: #0f2044; }
        .footer { margin-top: 48px; text-align: center; font-size: 10px; color: #ccc; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { margin: 0; padding: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div class="header-icon">${agent.emoji}</div>
        <div class="header-text">
          <h1>${agent.name}</h1>
          <p>BEN ECOSYSTEM IA · Mauro Monção Advogados Associados</p>
        </div>
      </div>
      <div class="meta">
        <span>📅 ${new Date(c.createdAt).toLocaleString('pt-BR')}</span>
        <span>🤖 Modelo: ${agent.model}</span>
        <span>💬 ${msgs.length} mensagens</span>
        <span>🏷️ ${agent.project === 'growth' ? 'Growth Center' : 'Juris Center'}</span>
      </div>
      ${msgs.map(m => `
        <div class="msg">
          <div class="label ${m.role === 'user' ? 'user-label' : 'agent-label'}">
            ${m.role === 'user' ? '👤 Dr. Mauro Monção' : agent.emoji + ' ' + agent.name} — ${new Date(m.timestamp).toLocaleTimeString('pt-BR')}
          </div>
          <div class="content ${m.role === 'user' ? 'user-content' : ''}">${m.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
        </div>
      `).join('')}
      <div class="footer">
        Documento gerado por BEN ECOSYSTEM IA em ${new Date().toLocaleString('pt-BR')}<br/>
        Mauro Monção Advogados Associados · Parnaíba-PI e Fortaleza-CE
      </div>
    </body></html>`
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 500)
  }, [activeConv, selectedAgent])

  // ── Item 1: Exportar como Markdown ──────────────────────
  const exportMarkdown = useCallback((conv?: Conversation) => {
    const c = conv || activeConv
    if (!c) return
    const agent = ECOSYSTEM_AGENTS.find(a => a.id === c.agentId)
    const lines = [
      `# ${c.agentEmoji} ${c.agentName}`,
      `**BEN ECOSYSTEM IA** · Mauro Monção Advogados Associados`,
      `**Data:** ${new Date(c.createdAt).toLocaleString('pt-BR')}`,
      '',
      '---',
      '',
      ...c.messages.filter(m => !m.isLoading).map(m => [
        `## ${m.role === 'user' ? '👤 Dr. Mauro Monção' : `${agent?.emoji} ${c.agentName}`}`,
        `*${new Date(m.timestamp).toLocaleString('pt-BR')}*`,
        '',
        m.content,
        '',
        '---',
        '',
      ]).flat(),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `ben-${c.agentId}-${new Date(c.createdAt).toISOString().slice(0, 10)}.md`
    a.click(); URL.revokeObjectURL(url)
  }, [activeConv])

  const renderLine = (line: string, li: number) => {
    if (line.startsWith('### ')) return <p key={li} className="font-bold text-sm mt-3 mb-1" style={{color:'#222'}}>{line.slice(4)}</p>
    if (line.startsWith('## '))  return <p key={li} className="font-bold mt-3 mb-1" style={{color:'#222'}}>{line.slice(3)}</p>
    if (line.startsWith('# '))   return <p key={li} className="font-extrabold text-base mt-3 mb-2" style={{color:'#222'}}>{line.slice(2)}</p>
    if (line.startsWith('---'))  return <hr key={li} className="my-2 border-gray-200"/>
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
      return <p key={li} className="ml-3 mb-0.5 flex gap-2" style={{color:'#333'}}><span className="text-gray-400">•</span><span>{line.slice(2)}</span></p>
    if (/^\d+\.\s/.test(line)) return <p key={li} className="ml-3 mb-0.5" style={{color:'#333'}}>{line}</p>
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{color:'#111'}}>{p.slice(2, -2)}</strong> : p
    )
    return <p key={li} className={line === '' ? 'mb-2' : 'mb-0.5'} style={{color:'#333'}}>{rendered}</p>
  }

  const renderAttachMenu = () => (
    <div className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-2xl border p-2 w-60 z-50" style={{borderColor:'#e5e7eb'}}>
      {showUrlInput ? (
        <div className="p-2">
          <input autoFocus value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
            placeholder="https://..." className="w-full text-xs border rounded-xl px-3 py-2 outline-none" style={{borderColor:'#d1d5db'}}/>
          <div className="flex gap-1 mt-2">
            <button onClick={handleAddUrl} className="flex-1 text-xs py-1.5 rounded-xl text-white font-medium" style={{background:'#0f2044'}}>Adicionar</button>
            <button onClick={() => setShowUrlInput(false)} className="px-3 text-xs py-1.5 rounded-xl bg-gray-100 text-gray-600">✕</button>
          </div>
        </div>
      ) : ATTACH_OPTIONS.map(opt => (
        <button key={opt.id} onClick={() => handleAttachOption(opt.id)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${opt.bg} ${opt.color} flex-shrink-0`}>{opt.icon}</div>
          <div>
            <p className="text-xs font-semibold text-gray-800">{opt.label}</p>
            <p className="text-[10px] text-gray-400">{opt.sub}</p>
          </div>
        </button>
      ))}
    </div>
  )

  const messages   = activeConv?.messages ?? []
  const hasMessages = messages.length > 0
  const recentConvs = conversations.filter(c => c.messages.filter(m=>!m.isLoading).length > 0)

  // ══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{background:'#ffffff'}}>

      {/* ══ Item 3: Banner de alertas do monitor (críticos) ════ */}
      {isAdmin && monitorStats && monitorStats.alertas.length > 0 && (
        <div className="flex-shrink-0 px-4 pt-2 space-y-1">
          {monitorStats.alertas.map((a, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
              a.level === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
            }`}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0"/>
              {a.msg}
              <a href="/monitor-admin" target="_blank" className="ml-auto underline text-[10px]">Ver detalhes →</a>
            </div>
          ))}
        </div>
      )}

      {/* ══ TOPO CENTRALIZADO — sempre visível ════════════════ */}
      <div className="flex-shrink-0 flex flex-col items-center pt-4 pb-2" style={{background:'#ffffff'}}>
        <img src="/falcone-logo.png" alt="Falcone"
          className="w-11 h-11 rounded-2xl object-cover shadow-md mb-1.5"
          onError={(e) => { e.currentTarget.style.display='none'; const fb = e.currentTarget.nextElementSibling as HTMLElement; if(fb) fb.style.display='flex' }}
        />
        <div className="w-11 h-11 rounded-2xl items-center justify-center text-white font-bold text-xl mb-1.5 hidden"
          style={{background:'linear-gradient(135deg,#D4A017,#b8860b)'}}>F</div>

        <h1 className="text-base font-bold tracking-tight" style={{color:'#0f2044'}}>BEN ECOSYSTEM IA Workspace</h1>
        <p className="text-[10px] mt-0.5" style={{color:'#888'}}>
          Mauro Monção Advogados · falcone · {visibleToUser.length} agentes ativos
          {isAdmin && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{background:'#D4A017'}}>ADMIN</span>}
        </p>

        {/* ── Status dots + ações ─────────────────────────── */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center px-2" style={{color:'#999'}}>
          <button onClick={checkStatus} className="flex items-center gap-1 text-xs hover:text-gray-600 transition-colors" title="Verificar status dos sistemas">
            <span className="flex items-center gap-1"><StatusDot status={ecoStatus.growth}/> Growth</span>
          </button>
          <button onClick={checkStatus} className="flex items-center gap-1 text-xs hover:text-gray-600 transition-colors">
            <span className="flex items-center gap-1"><StatusDot status={ecoStatus.juris}/> Juris</span>
          </button>
          <button onClick={checkStatus} className="flex items-center gap-1 text-xs hover:text-gray-600 transition-colors">
            <span className="flex items-center gap-1"><StatusDot status={ecoStatus.vps}/> VPS</span>
          </button>
          <button onClick={checkStatus} className="text-gray-400 hover:text-gray-600 transition-colors" title="Atualizar status">
            <RefreshCw className="w-3 h-3"/>
          </button>

          {/* ── Item 1: botão histórico ─────── */}
          <button onClick={() => setShowHistory(v => !v)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${showHistory ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
            style={showHistory ? {background:'#0f2044'} : {}}>
            <History className="w-3 h-3"/> Histórico ({recentConvs.length})
          </button>

          {hasMessages && (
            <>
              <button onClick={() => exportTXT()} title="Exportar TXT"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                <FileDown className="w-3 h-3"/> TXT
              </button>
              <button onClick={() => exportPDF()} title="Exportar PDF"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                <BookOpen className="w-3 h-3"/> PDF
              </button>
              <button onClick={() => exportMarkdown()} title="Exportar Markdown"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all">
                <Download className="w-3 h-3"/> MD
              </button>
            </>
          )}

          {/* ── Item 4: perfil ─────────────────── */}
          <button onClick={() => setShowProfile(v => !v)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${showProfile ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
            style={showProfile ? {background:'#0f2044'} : {}}>
            <User className="w-3 h-3"/> Perfil
          </button>

          {/* ── Item 3: monitor (admin) ─────────── */}
          {isAdmin && (
            <>
              <button onClick={() => { setShowMonitor(v => !v); if (!monitorStats) loadMonitorStats() }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${showMonitor ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                style={showMonitor ? {background:'#7f1d1d'} : {}}>
                <BarChart3 className="w-3 h-3"/> Monitor
                {monitorStats && monitorStats.alertas.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-0.5"/>
                )}
              </button>
              <a href="/monitor-admin" target="_blank"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                style={{background:'#7f1d1d22', color:'#dc2626'}}>
                <Shield className="w-3 h-3"/> Full
              </a>
            </>
          )}
        </div>
      </div>

      {/* ══ Item 4: Painel de Perfil ═══════════════════════════ */}
      {showProfile && (
        <div className="flex-shrink-0 border-t border-b mx-4 my-1 rounded-xl overflow-hidden" style={{borderColor:'#f0f0f0'}}>
          <div className="flex items-start gap-4 p-4 bg-gray-50">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{background: isAdmin ? 'linear-gradient(135deg,#D4A017,#b8860b)' : '#0f2044'}}>
              {(user?.nome || 'U')[0].toUpperCase()}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold" style={{color:'#0f2044'}}>{user?.nome || 'Usuário'}</p>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{background:'#D4A017'}}>
                    ADMINISTRADOR
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{user?.email}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Fonte: {user?.source || 'ecosystem'} · Sessão ativa por 8h
              </p>
              {/* Permissões */}
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                  ✅ {visibleToUser.length} agentes disponíveis
                </span>
                {!isAdmin && RESTRICTED_AGENTS.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                    🔒 {RESTRICTED_AGENTS.length} agentes restritos (Admin)
                  </span>
                )}
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                    ⭐ Acesso total incluindo peritos avançados
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={logout}
                className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 text-red-500 border border-red-200">
                <LogOut className="w-3 h-3"/> Sair
              </button>
              <button onClick={() => setShowProfile(false)}
                className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200">
                <X className="w-3 h-3"/> Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Item 3: Mini Monitor inline (admin) ════════════════ */}
      {showMonitor && isAdmin && (
        <div className="flex-shrink-0 border-t border-b mx-4 my-1 rounded-xl overflow-hidden" style={{borderColor:'#f0f0f0'}}>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-900" style={{borderRadius:'12px 12px 0 0'}}>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-red-400"/>
              <span className="text-xs font-semibold text-white">Monitor de Tokens & Custos</span>
              {monitorLoading && <Loader2 className="w-3 h-3 text-gray-400 animate-spin"/>}
            </div>
            <div className="flex gap-2">
              <button onClick={loadMonitorStats}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3"/> Atualizar
              </button>
              <a href="/monitor-admin" target="_blank"
                className="text-[10px] text-yellow-400 hover:text-yellow-300">Painel completo →</a>
              <button onClick={() => setShowMonitor(false)} className="text-gray-400 hover:text-white">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
          {monitorStats ? (
            <div className="grid grid-cols-4 gap-px bg-gray-800" style={{borderRadius:'0 0 12px 12px', overflow:'hidden'}}>
              {[
                { icon: Zap,        label: 'Chamadas',    value: monitorStats.totalCalls.toString(),                               color: 'text-blue-400'   },
                { icon: Clock,      label: 'Custo Hoje',  value: `$ ${monitorStats.dailyCostUsd.toFixed(4)}`,                    color: monitorStats.dailyCostUsd > 5 ? 'text-red-400' : 'text-green-400' },
                { icon: TrendingUp, label: 'Custo Mês',   value: `$ ${monitorStats.monthlyCostUsd.toFixed(2)}`,                  color: monitorStats.monthlyCostUsd > 100 ? 'text-yellow-400' : 'text-indigo-400' },
                { icon: Filter,     label: 'Tokens',      value: monitorStats.totalTokens >= 1000 ? `${(monitorStats.totalTokens/1000).toFixed(1)}k` : monitorStats.totalTokens.toString(), color: 'text-purple-400' },
              ].map((kpi, i) => (
                <div key={i} className="flex flex-col items-center py-3 bg-gray-900 hover:bg-gray-800 transition-colors">
                  <kpi.icon className={`w-4 h-4 mb-1 ${kpi.color}`}/>
                  <p className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[10px] text-gray-500">{kpi.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 bg-gray-900" style={{borderRadius:'0 0 12px 12px'}}>
              {monitorLoading
                ? <Loader2 className="w-5 h-5 text-gray-500 animate-spin"/>
                : <p className="text-xs text-gray-500">Nenhum dado disponível. Execute agentes para acumular estatísticas.</p>
              }
            </div>
          )}
        </div>
      )}

      {/* ══ Item 1: Painel de Histórico ════════════════════════ */}
      {showHistory && (
        <div className="flex-shrink-0 border-t border-b mx-4 my-1 rounded-xl overflow-hidden" style={{borderColor:'#f0f0f0', maxHeight:'240px'}}>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b" style={{borderColor:'#f0f0f0'}}>
            <span className="text-xs font-semibold" style={{color:'#444'}}>
              Histórico de Conversas ({recentConvs.length})
            </span>
            <div className="flex gap-2 items-center">
              {/* Filtro estrela */}
              <button onClick={() => setHistoryFilter(v => v === 'all' ? 'starred' : 'all')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${historyFilter === 'starred' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                <Star className="w-3 h-3"/> Favoritos
              </button>
              {recentConvs.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1">
                  <Trash2 className="w-3 h-3"/> Limpar
                </button>
              )}
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
          {/* Busca */}
          <div className="px-3 py-1.5 bg-gray-50 border-b" style={{borderColor:'#f0f0f0'}}>
            <div className="flex items-center gap-2 bg-white rounded-lg border px-2.5 py-1.5" style={{borderColor:'#e5e7eb'}}>
              <Search className="w-3 h-3 text-gray-400 flex-shrink-0"/>
              <input ref={histSearchRef} value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Buscar por título, agente ou conteúdo…"
                className="flex-1 text-xs outline-none bg-transparent" style={{color:'#222'}}/>
              {historySearch && (
                <button onClick={() => setHistorySearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3"/>
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto" style={{maxHeight:'150px', background:'#fff'}}>
            {filteredHistory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-5">
                {historySearch ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa salva ainda.'}
              </p>
            ) : filteredHistory.map(conv => {
              const agent = ECOSYSTEM_AGENTS.find(a => a.id === conv.agentId)
              const msgCount = conv.messages.filter(m => !m.isLoading).length
              return (
                <div key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`flex items-center gap-2 px-3 py-2 border-b cursor-pointer hover:bg-gray-50 transition-colors ${activeConvId === conv.id ? 'bg-blue-50' : ''}`}
                  style={{borderColor:'#f5f5f5'}}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{background: (agent?.color || '#888') + '18'}}>
                    {conv.agentEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingTitle === conv.id ? (
                      <input
                        autoFocus
                        value={editTitleVal}
                        onChange={e => setEditTitleVal(e.target.value)}
                        onBlur={() => confirmRename(conv.id)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmRename(conv.id); if (e.key === 'Escape') setEditingTitle(null) }}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-xs border rounded px-1.5 py-0.5 outline-none"
                        style={{borderColor:'#D4A017', color:'#222'}}
                      />
                    ) : (
                      <p className="text-xs font-medium truncate" style={{color:'#222'}}>{conv.title}</p>
                    )}
                    <p className="text-[10px] truncate" style={{color:'#888'}}>
                      {conv.agentName} · {new Date(conv.updatedAt).toLocaleDateString('pt-BR')} · {msgCount} msgs
                    </p>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={(e) => toggleStar(conv.id, e)}
                      className={`p-1 rounded hover:bg-yellow-50 transition-colors ${conv.starred ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                      title="Favoritar">
                      <Star className="w-3 h-3"/>
                    </button>
                    <button onClick={(e) => startRename(conv, e)}
                      className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors" title="Renomear">
                      <Edit3 className="w-3 h-3"/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); exportTXT(conv) }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors" title="Exportar TXT">
                      <FileDown className="w-3 h-3"/>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); exportPDF(conv) }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors" title="Exportar PDF">
                      <BookOpen className="w-3 h-3"/>
                    </button>
                    <button onClick={(e) => deleteConversation(conv.id, e)}
                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Deletar">
                      <Trash2 className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ ÁREA DE MENSAGENS ══════════════════════════════════ */}
      {hasMessages && activeConv && selectedAgent && (
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{background:'#fafafa', minHeight:0}}>
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base mr-2 flex-shrink-0 mt-0.5"
                    style={{background: selectedAgent.color + '18'}}>
                    {selectedAgent.emoji}
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm shadow-sm'}`}
                  style={msg.role === 'user'
                    ? {background:'#0f2044', color:'#ffffff'}
                    : {background:'#ffffff', border:'1px solid #e5e7eb', color:'#222222'}}>
                  {msg.isLoading ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 className="w-4 h-4 animate-spin" style={{color: selectedAgent.color}}/>
                      <span className="text-sm text-gray-400">Processando…</span>
                      {/* Item 2: indicar sistema de destino */}
                      <span className="text-[10px] text-gray-300">
                        → {selectedAgent.project === 'growth' ? 'Growth' : 'Juris'} Center
                      </span>
                    </div>
                  ) : msg.role === 'user' ? (
                    <>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {msg.attachments.map(a => (
                            <span key={a.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">📎 {a.name.slice(0, 20)}</span>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed">
                        {msg.content.split('\n').map((line, li) => renderLine(line, li))}
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 flex-wrap">
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                        </span>
                        {msg.modelUsed && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{msg.modelUsed}</span>
                        )}
                        {/* Item 2: badge de destino */}
                        {msg.destino && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${msg.destino === 'growth' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {msg.destino === 'growth' ? '⚡ Growth' : '⚖️ Juris'}
                          </span>
                        )}
                        {msg.elapsed_ms && msg.elapsed_ms > 0 && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5"/>{(msg.elapsed_ms/1000).toFixed(1)}s
                          </span>
                        )}
                        <div className="ml-auto flex gap-1">
                          <button onClick={() => copyMessage(msg.id, msg.content)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Copiar">
                            {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500"/> : <Copy className="w-3.5 h-3.5"/>}
                          </button>
                          <button onClick={() => exportTXT()}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Baixar TXT">
                            <Download className="w-3.5 h-3.5"/>
                          </button>
                          <button onClick={() => exportPDF()}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Exportar PDF">
                            <BookOpen className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
        </div>
      )}

      {/* ══ INPUT + CARROSSEL — sempre visível ════════════════ */}
      <div className={`flex-shrink-0 flex flex-col items-center px-4 pb-3 ${!hasMessages ? 'flex-1 justify-center' : 'pt-2'}`}
        style={{background:'#ffffff'}}>

        {/* ── INPUT CENTRALIZADO ─────────────────────────────── */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {selectedAgent ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{background: selectedAgent.color + '15', color: selectedAgent.color, border:`1px solid ${selectedAgent.color}40`}}>
                <span>{selectedAgent.emoji}</span>
                <span>{selectedAgent.name}</span>
                {/* Item 2: status do sistema do agente */}
                <StatusDot status={agentStatus(selectedAgent)}/>
                <button onClick={() => {setSelectedAgent(null); setActiveConvId(null)}} title="Desativar agente">
                  <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100"/>
                </button>
              </div>
            ) : (
              <span className="text-xs italic" style={{color:'#aaa'}}>Selecione um agente abaixo ↓</span>
            )}
            <button onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${useSearch ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title="Pesquisa web em tempo real">
              <Globe className="w-3 h-3"/> Web
            </button>
            <button onClick={() => setLetterheadMode(!letterheadMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${letterheadMode ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              style={letterheadMode ? {background:'#0f2044'} : {}}
              title="Usar timbre oficial do escritório">
              <TrendingUp className="w-3 h-3"/> Timbre
            </button>
            {hasMessages && selectedAgent && (
              <button onClick={() => {
                const newId = `conv-${Date.now()}`
                const newConv: Conversation = {
                  id: newId, title: `${selectedAgent.emoji} ${selectedAgent.name}`,
                  agentId: selectedAgent.id, agentName: selectedAgent.name, agentEmoji: selectedAgent.emoji,
                  messages: [], createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(), project: selectedAgent.project,
                  starred: false, tags: [],
                }
                setConversations(prev => [newConv, ...prev])
                setActiveConvId(newId); setPrompt(''); setAttachments([])
              }} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 ml-auto">
                <Plus className="w-3 h-3"/> Nova conversa
              </button>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.map(att => (
                <span key={att.id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  📎 {att.name.slice(0, 25)}
                  <button onClick={() => setAttachments(p => p.filter(a => a.id !== att.id))}><X className="w-3 h-3"/></button>
                </span>
              ))}
            </div>
          )}

          {/* Item 2: aviso de sistema offline quando agente selecionado */}
          {selectedAgent && agentStatus(selectedAgent) === 'offline' && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
              <WifiOff className="w-3.5 h-3.5 flex-shrink-0"/>
              Sistema {selectedAgent.project === 'growth' ? 'Growth Center' : 'Juris Center'} pode estar offline.
              As mensagens serão tentadas mesmo assim (retry automático).
              <button onClick={checkStatus} className="ml-auto underline text-[10px]">Verificar</button>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border shadow-sm px-4 py-3"
            style={{borderColor: selectedAgent ? selectedAgent.color + '60' : '#e5e7eb', background:'#ffffff'}}>
            <div className="relative flex-shrink-0" ref={attachMenuRef}>
              <button onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors" style={{color:'#888'}}>
                <Paperclip className="w-4 h-4"/>
              </button>
              {attachMenuOpen && renderAttachMenu()}
            </div>
            <textarea ref={textareaRef} value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isLoading) sendMessage() } }}
              placeholder={selectedAgent
                ? `Mensagem para ${selectedAgent.emoji} ${selectedAgent.name}… (Enter para enviar)`
                : 'Selecione um agente abaixo e descreva o caso ou faça sua solicitação…'}
              rows={1} className="flex-1 resize-none text-sm outline-none"
              style={{background:'transparent', maxHeight:'160px', lineHeight:'1.5', color:'#222222'}}
            />
            <button onClick={sendMessage} disabled={isLoading || !prompt.trim() || !selectedAgent}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
              style={{
                background: isLoading || !prompt.trim() || !selectedAgent ? '#e5e7eb' : '#D4A017',
                color:      isLoading || !prompt.trim() || !selectedAgent ? '#aaa' : '#0f2044',
              }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            </button>
          </div>
          <p className="text-center text-[10px] mt-1" style={{color:'#ccc'}}>Shift+Enter nova linha · Enter enviar · retry automático em falha</p>
        </div>

        {/* ── CARROSSEL DE AGENTES ───────────────────────────── */}
        <div className="w-full max-w-3xl mt-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{color:'#888'}}>
              Selecione um agente
            </p>
            <div className="flex items-center gap-1.5">
              {(['all','growth','juris'] as const).map(p => (
                <button key={p} onClick={() => { setFilterProject(p); setCarouselIdx(0) }}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${filterProject === p ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                  style={filterProject === p ? {background: p==='growth' ? '#059669' : p==='juris' ? '#1d4ed8' : '#0f2044'} : {}}>
                  {p === 'all' ? `Todos (${visibleToUser.length})` : p === 'growth' ? `Growth (${visibleToUser.filter(a=>a.project==='growth').length})` : `Juris (${visibleToUser.filter(a=>a.project==='juris').length})`}
                </button>
              ))}
              <span className="text-[10px] text-gray-400 ml-1">{carouselIdx+1}/{totalSlides}</span>
              <button onClick={() => setCarouselIdx(i => Math.max(0, i-1))} disabled={carouselIdx === 0}
                className="w-5 h-5 flex items-center justify-center rounded border disabled:opacity-30 hover:bg-gray-50" style={{borderColor:'#e5e7eb'}}>
                <ChevronLeft className="w-3 h-3 text-gray-500"/>
              </button>
              <button onClick={() => setCarouselIdx(i => Math.min(totalSlides-1, i+1))} disabled={carouselIdx >= totalSlides-1}
                className="w-5 h-5 flex items-center justify-center rounded border disabled:opacity-30 hover:bg-gray-50" style={{borderColor:'#e5e7eb'}}>
                <ChevronRight className="w-3 h-3 text-gray-500"/>
              </button>
            </div>
          </div>

          {/* Cards 4 colunas */}
          <div className="grid grid-cols-4 gap-3">
            {visibleAgents.map(agent => {
              const sysStatus  = agentStatus(agent)
              const isRestricted = !isAdmin && RESTRICTED_AGENTS.includes(agent.id)
              const failCount  = retryCount[agent.id] || 0
              return (
                <button key={agent.id} onClick={() => selectAgent(agent)}
                  disabled={isRestricted}
                  className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all group ${selectedAgent?.id === agent.id ? 'shadow-md' : isRestricted ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-sm hover:bg-gray-50'}`}
                  style={{
                    background: selectedAgent?.id === agent.id ? agent.color + '08' : '#ffffff',
                    borderColor: selectedAgent?.id === agent.id ? agent.color : failCount > 0 ? '#fca5a5' : '#e5e7eb',
                    borderWidth: selectedAgent?.id === agent.id ? '2px' : '1px',
                  }}>
                  {/* Ícone + dot de status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105"
                      style={{background: agent.color + '18', border:`1.5px solid ${agent.color}35`}}>
                      {agent.emoji}
                    </div>
                    {/* Item 2: status real do sistema */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      sysStatus === 'online'   ? 'bg-green-500' :
                      sysStatus === 'offline'  ? 'bg-red-500' :
                      sysStatus === 'degraded' ? 'bg-yellow-400' : 'bg-gray-400 animate-pulse'
                    }`}/>
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight line-clamp-2 mb-1" style={{color:'#222222'}}>{agent.name}</p>
                    <p className="text-[10px] leading-tight line-clamp-2 mb-1.5" style={{color:'#888'}}>{agent.description}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${agent.project === 'growth' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {agent.project === 'growth' ? 'Growth' : 'Juris'}
                      </span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${agent.modelBadge}`}>
                        {agent.model.length > 14 ? agent.model.slice(0,14)+'…' : agent.model}
                      </span>
                      {isRestricted && <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold">🔒 Admin</span>}
                      {/* Item 2: indicador de falhas recentes */}
                      {failCount > 0 && <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-bold">⚠️ {failCount}x</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Dots de paginação */}
          <div className="flex justify-center gap-1.5 mt-3">
            {Array.from({length: totalSlides}).map((_, i) => (
              <button key={i} onClick={() => setCarouselIdx(i)}
                className="rounded-full transition-all"
                style={{width: i === carouselIdx ? 20 : 7, height: 7, background: i === carouselIdx ? '#D4A017' : '#d1d5db'}}/>
            ))}
          </div>

          {/* Item 2: legenda de status */}
          <div className="flex justify-center gap-4 mt-2">
            {([
              { status: 'online',   label: 'Online',    color: 'bg-green-500' },
              { status: 'offline',  label: 'Offline',   color: 'bg-red-500'   },
              { status: 'degraded', label: 'Degradado', color: 'bg-yellow-400'},
              { status: 'checking', label: 'Verificando',color:'bg-gray-400'  },
            ] as const).map(({ status, label, color }) => (
              <div key={status} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${color} ${status === 'checking' ? 'animate-pulse' : ''}`}/>
                <span className="text-[9px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef}  type="file" multiple accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.eml" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
      <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
      <input ref={audioInputRef} type="file" multiple accept="audio/*" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
    </div>
  )
}
