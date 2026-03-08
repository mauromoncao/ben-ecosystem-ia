import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Paperclip, FileText, Globe, Mic, Camera,
  Mail, HardDrive, Link2, Download, Copy, Check,
  X, Loader2, ChevronLeft, ChevronRight, Trash2,
  RefreshCw, Activity, Zap, TrendingUp, Plus,
  Scale, Megaphone, Cpu, Users
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────
type Project       = 'growth' | 'juris'
type AgentCategory = 'atendimento' | 'juridico' | 'marketing' | 'sistema' | 'contador' | 'perito'
type ModuleStatus  = 'online' | 'offline' | 'degraded' | 'checking'

interface Agent {
  id: string
  name: string
  emoji: string
  description: string
  model: string
  modelBadge: string
  category: AgentCategory
  project: Project | 'both'
  color: string
  active: boolean
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  base64?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  agentName?: string
  timestamp: Date
  attachments?: Attachment[]
  isLoading?: boolean
  modelUsed?: string
  destino?: string
  elapsed_ms?: number
}

interface Conversation {
  id: string
  title: string
  agentId: string
  messages: Message[]
  createdAt: Date
  project: Project | 'both'
}

interface EcosystemStatus {
  growth: ModuleStatus
  juris:  ModuleStatus
  vps:    ModuleStatus
  lastCheck?: string
}

// ─── Agentes ──────────────────────────────────────────────────
const ECOSYSTEM_AGENTS: Agent[] = [
  { id: 'ben-atendente',              name: 'BEN Atendente Jurídico',        emoji: '🤖', description: 'Qualificação de leads, triagem e atendimento 24/7.', model: 'GPT-4o Mini',      modelBadge: 'bg-blue-100 text-blue-800',    category: 'atendimento', project: 'growth', color: '#0f2044', active: true },
  { id: 'mara-ia',                    name: 'MARA — Secretária IA',           emoji: '👩‍💼', description: 'Agenda, notificações, triagem urgente e WhatsApp executivo.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800',    category: 'atendimento', project: 'growth', color: '#1e3470', active: true },
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
  { id: 'ben-contador-tributarista',             name: 'BEN Contador — Triagem',       emoji: '🧮', description: 'Triagem fiscal: classifica e encaminha ao especialista correto.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#92400e', active: true },
  { id: 'ben-contador-tributarista-especialista',name: 'BEN Contador — Especialista',  emoji: '📊', description: 'Análise fiscal profunda — planejamento tributário avançado.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'contador', project: 'juris', color: '#b45309', active: true },
  { id: 'ben-contador-tributarista-planejamento',name: 'BEN Contador — Planejamento',  emoji: '🗺️', description: 'Planejamento tributário estratégico e otimização de carga.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'contador', project: 'juris', color: '#d97706', active: true },
  { id: 'ben-contador-tributarista-creditos',    name: 'BEN Contador — Créditos',      emoji: '💳', description: 'Recuperação de créditos tributários e compensações.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#059669', active: true },
  { id: 'ben-contador-tributarista-auditoria',   name: 'BEN Contador — Auditoria',     emoji: '🔍', description: 'Auditoria fiscal, conformidade tributária e gestão de risco.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#dc2626', active: true },
  { id: 'ben-contador-tributarista-relatorio',   name: 'BEN Contador — Relatório',     emoji: '📋', description: 'Relatórios fiscais executivos e dashboards tributários.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-perito-forense',          name: 'BEN Perito Forense — Padrão',   emoji: '🔬', description: 'Análise pericial padrão — laudos e pareceres técnicos.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'perito', project: 'juris', color: '#4f46e5', active: true },
  { id: 'ben-perito-forense-profundo', name: 'BEN Perito Forense — Profundo ⚠️', emoji: '🧬', description: 'Análise pericial profunda — alto custo, máxima precisão.', model: 'Claude Opus 4.6', modelBadge: 'bg-red-100 text-red-800', category: 'perito', project: 'juris', color: '#b91c1c', active: true },
  { id: 'ben-perito-forense-digital',  name: 'BEN Perito Forense Digital',    emoji: '💻', description: 'Perícia digital e análise de evidências eletrônicas.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'perito', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-perito-forense-laudo',    name: 'BEN Perito Forense — Laudo',    emoji: '📄', description: 'Elaboração de laudos periciais técnicos para processos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-perito-forense-contestar',name: 'BEN Perito — Contraditório',    emoji: '🛡️', description: 'Contestação de laudos adversariais e quesitos técnicos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#059669', active: true },
  { id: 'ben-perito-forense-relatorio',name: 'BEN Perito Forense — Relatório',emoji: '📊', description: 'Relatórios periciais executivos e sínteses técnicas.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#374151', active: true },
]

// ─── Logo Falcone SVG ─────────────────────────────────────────
function FalconeLogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="18" fill="#0f1a3e"/>
      <defs>
        <linearGradient id="goldGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0c040"/>
          <stop offset="50%" stopColor="#D4A017"/>
          <stop offset="100%" stopColor="#b8860b"/>
        </linearGradient>
        <linearGradient id="purpGrad" x1="20" y1="80" x2="80" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#a855f7"/>
        </linearGradient>
      </defs>
      {/* Letra B dourada */}
      <path d="M28 22 L28 78 L54 78 C66 78 74 70 74 60 C74 53 70 48 64 46 C69 43 72 38 72 32 C72 23 65 22 54 22 Z
               M38 32 L52 32 C57 32 62 34 62 40 C62 46 57 48 52 48 L38 48 Z
               M38 57 L54 57 C60 57 64 60 64 65 C64 70 60 68 54 68 L38 68 Z"
        fill="url(#goldGrad)"/>
      {/* Circuito roxo decorativo */}
      <circle cx="28" cy="22" r="3" fill="url(#purpGrad)" opacity="0.9"/>
      <circle cx="28" cy="78" r="3" fill="url(#purpGrad)" opacity="0.9"/>
      <circle cx="74" cy="46" r="2.5" fill="url(#purpGrad)" opacity="0.8"/>
      <line x1="74" y1="46" x2="82" y2="38" stroke="url(#purpGrad)" strokeWidth="1.5" opacity="0.7"/>
      <circle cx="82" cy="38" r="2" fill="url(#purpGrad)" opacity="0.7"/>
      <line x1="74" y1="60" x2="82" y2="68" stroke="url(#purpGrad)" strokeWidth="1.5" opacity="0.7"/>
      <circle cx="82" cy="68" r="2" fill="url(#purpGrad)" opacity="0.7"/>
      <line x1="28" y1="22" x2="18" y2="14" stroke="url(#purpGrad)" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="18" cy="14" r="2" fill="url(#purpGrad)" opacity="0.6"/>
    </svg>
  )
}

// ─── Status dot ───────────────────────────────────────────────
function StatusDot({ status }: { status: ModuleStatus }) {
  const map: Record<ModuleStatus, string> = {
    online:   'bg-green-500',
    offline:  'bg-red-500',
    degraded: 'bg-yellow-400',
    checking: 'bg-gray-400 animate-pulse',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`} />
}

// ─── Opções de anexo ──────────────────────────────────────────
const ATTACH_OPTIONS = [
  { id: 'file',  icon: <FileText className="w-4 h-4"/>, label: 'Documento',    sub: 'PDF, Word, TXT, Excel',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { id: 'image', icon: <Camera   className="w-4 h-4"/>, label: 'Imagem/Foto',  sub: 'JPG, PNG, WebP',          color: 'text-green-600',  bg: 'bg-green-50'  },
  { id: 'email', icon: <Mail     className="w-4 h-4"/>, label: 'E-mail',        sub: 'Importar .eml',           color: 'text-red-500',    bg: 'bg-red-50'    },
  { id: 'drive', icon: <HardDrive className="w-4 h-4"/>,label: 'Google Drive',  sub: 'Conectar Drive',          color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'url',   icon: <Link2    className="w-4 h-4"/>, label: 'Link / URL',    sub: 'Página web ou doc',       color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'audio', icon: <Mic      className="w-4 h-4"/>, label: 'Áudio',         sub: 'MP3, M4A, transcrição',   color: 'text-pink-600',   bg: 'bg-pink-50'   },
]

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function EcosystemWorkspace() {
  const [selectedAgent, setSelectedAgent]   = useState<Agent | null>(null)
  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId]     = useState<string | null>(null)
  const [prompt, setPrompt]                 = useState('')
  const [attachments, setAttachments]       = useState<Attachment[]>([])
  const [isLoading, setIsLoading]           = useState(false)
  const [copiedMsgId, setCopiedMsgId]       = useState<string | null>(null)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [urlInput, setUrlInput]             = useState('')
  const [showUrlInput, setShowUrlInput]     = useState(false)
  const [useSearch, setUseSearch]           = useState(false)
  const [letterheadMode, setLetterheadMode] = useState(false)
  const [filterProject, setFilterProject]  = useState<'all' | 'growth' | 'juris'>('all')
  const [carouselIdx, setCarouselIdx]       = useState(0)
  const [ecoStatus, setEcoStatus]           = useState<EcosystemStatus>({ growth: 'checking', juris: 'checking', vps: 'checking' })

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const imageInputRef  = useRef<HTMLInputElement>(null)
  const audioInputRef  = useRef<HTMLInputElement>(null)
  const chatEndRef     = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const attachMenuRef  = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  // ── Verifica status ───────────────────────────────────────────
  const checkStatus = useCallback(async () => {
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
    } catch { /* silencioso */ }
    setEcoStatus({ growth: 'offline', juris: 'offline', vps: 'offline', lastCheck: new Date().toLocaleTimeString('pt-BR') })
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false); setShowUrlInput(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConv?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [prompt])

  // ── Agentes filtrados para carrossel ─────────────────────────
  const filteredAgents = ECOSYSTEM_AGENTS.filter(a =>
    filterProject === 'all' || a.project === filterProject
  )
  const CARDS_PER_SLIDE = 5
  const totalSlides = Math.ceil(filteredAgents.length / CARDS_PER_SLIDE)
  const visibleAgents = filteredAgents.slice(carouselIdx * CARDS_PER_SLIDE, (carouselIdx + 1) * CARDS_PER_SLIDE)

  // ── Nova conversa ─────────────────────────────────────────────
  const startConversation = useCallback((agent: Agent) => {
    const newId = `conv-${Date.now()}`
    const newConv: Conversation = {
      id: newId, title: `${agent.emoji} ${agent.name}`,
      agentId: agent.id, messages: [], createdAt: new Date(), project: agent.project,
    }
    setConversations(prev => [newConv, ...prev])
    setSelectedAgent(agent)
    setActiveConvId(newId)
    setPrompt(''); setAttachments([])
  }, [])

  // ── Upload ────────────────────────────────────────────────────
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

  // ── Enviar mensagem ───────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = prompt.trim()
    if (!text || !selectedAgent || !activeConvId) return

    const attachText = attachments.length > 0
      ? '\n\n[ARQUIVOS ANEXADOS]\n' + attachments.map(a =>
          a.type === 'text/url' ? `• URL: ${a.name}` : `• ${a.name} (${(a.size/1024).toFixed(1)} KB)`
        ).join('\n')
      : ''

    const fullPrompt = text + attachText
      + (letterheadMode ? '\n\n[INSTRUÇÃO: Usar timbre oficial — Mauro Monção Advogados, Parnaíba-PI e Fortaleza-CE, OAB/PI.]' : '')

    const userMsg: Message = {
      id: `msg-${Date.now()}`, role: 'user', content: text,
      timestamp: new Date(), attachments: attachments.length > 0 ? [...attachments] : undefined,
    }
    const loadingMsg: Message = {
      id: `msg-loading-${Date.now()}`, role: 'assistant', content: '',
      agentId: selectedAgent.id, agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
      timestamp: new Date(), isLoading: true,
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...c.messages, userMsg, loadingMsg],
            title: c.messages.length === 0 ? text.slice(0, 50) + (text.length > 50 ? '…' : '') : c.title }
        : c
    ))
    setPrompt(''); setAttachments([]); setIsLoading(true)

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
      })

      let resultText = '', modelUsed = '', destino = '', elapsed = 0
      if (res.ok) {
        const d = await res.json()
        resultText = d.output || d.result || d.resposta || d.content || JSON.stringify(d)
        modelUsed  = d.modelUsed || d.model || ''
        destino    = d.destino   || ''
        elapsed    = d.elapsed_ms || 0
      } else {
        const err = await res.json().catch(() => ({}))
        resultText = `⚠️ O agente **${selectedAgent.name}** está temporariamente indisponível (${res.status}).\n\n${err.error || 'Verifique as configurações de API no Vercel.'}`
      }

      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
              id: `msg-${Date.now()}`, role: 'assistant', content: resultText,
              agentId: selectedAgent.id, agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
              timestamp: new Date(), modelUsed, destino, elapsed_ms: elapsed,
            }) }
          : c
      ))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
              id: `msg-err-${Date.now()}`, role: 'assistant',
              content: `⚠️ Não foi possível conectar ao agente **${selectedAgent.name}**.\n\nErro: ${msg}`,
              agentId: selectedAgent.id, agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
              timestamp: new Date(),
            }) }
          : c
      ))
    } finally { setIsLoading(false) }
  }, [prompt, selectedAgent, activeConvId, attachments, conversations, useSearch, letterheadMode])

  // ── Copy / Download ───────────────────────────────────────────
  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMsgId(msgId)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }
  const downloadDocument = (content: string, name: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Markdown simples ──────────────────────────────────────────
  const renderLine = (line: string, li: number) => {
    if (line.startsWith('### ')) return <p key={li} className="font-bold text-sm mt-3 mb-1 text-gray-900">{line.slice(4)}</p>
    if (line.startsWith('## '))  return <p key={li} className="font-bold mt-3 mb-1 text-gray-900">{line.slice(3)}</p>
    if (line.startsWith('# '))   return <p key={li} className="font-extrabold text-base mt-3 mb-2 text-gray-900">{line.slice(2)}</p>
    if (line.startsWith('---'))  return <hr key={li} className="my-2 border-gray-200"/>
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
      return <p key={li} className="ml-3 mb-0.5 flex gap-2 text-gray-800"><span className="text-gray-400">•</span><span>{line.slice(2)}</span></p>
    if (/^\d+\.\s/.test(line))
      return <p key={li} className="ml-3 mb-0.5 text-gray-800">{line}</p>
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="text-gray-900">{p.slice(2,-2)}</strong> : p
    )
    return <p key={li} className={`${line === '' ? 'mb-2' : 'mb-0.5'} text-gray-800`}>{rendered}</p>
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: TELA INICIAL (sem agente selecionado)
  // ══════════════════════════════════════════════════════════════
  const renderWelcome = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Cabeçalho centralizado ── */}
      <div className="flex flex-col items-center pt-10 pb-6 px-4">
        <FalconeLogo size={64} />
        <h1 className="mt-4 text-2xl font-bold tracking-tight" style={{ color: '#222222' }}>
          BEN ECOSYSTEM IA Workspace
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#666666' }}>
          Mauro Monção Advogados Associados &nbsp;·&nbsp; {ECOSYSTEM_AGENTS.length} agentes ativos
        </p>
        {/* Status dots */}
        <div className="mt-3 flex items-center gap-5 text-xs" style={{ color: '#888888' }}>
          <span className="flex items-center gap-1.5"><StatusDot status={ecoStatus.growth}/> Growth</span>
          <span className="flex items-center gap-1.5"><StatusDot status={ecoStatus.juris}/> Juris</span>
          <span className="flex items-center gap-1.5"><StatusDot status={ecoStatus.vps}/> VPS</span>
          <button onClick={checkStatus} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw className="w-3 h-3"/>
          </button>
        </div>
      </div>

      {/* ── Input centralizado ── */}
      <div className="px-4 w-full max-w-3xl mx-auto">
        {/* Anexos */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map(att => (
              <span key={att.id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                📎 {att.name.slice(0,25)}
                <button onClick={() => setAttachments(p => p.filter(a => a.id !== att.id))} className="ml-0.5">
                  <X className="w-3 h-3"/>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Caixa de input principal */}
        <div className="rounded-2xl border shadow-md overflow-visible" style={{ borderColor: '#e5e7eb', background: '#ffffff' }}>
          {/* Linha de opções */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 border-b" style={{ borderColor: '#f3f4f6' }}>
            {selectedAgent && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: selectedAgent.color + '15', color: selectedAgent.color, border: `1px solid ${selectedAgent.color}40` }}>
                <span>{selectedAgent.emoji}</span>
                <span>{selectedAgent.name}</span>
                <button onClick={() => { setSelectedAgent(null); setActiveConvId(null) }}><X className="w-3 h-3"/></button>
              </div>
            )}
            <button onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${useSearch ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              <Globe className="w-3 h-3"/> Pesquisa Web
            </button>
            <button onClick={() => setLetterheadMode(!letterheadMode)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${letterheadMode ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              style={letterheadMode ? { background: '#0f2044' } : {}}>
              <TrendingUp className="w-3 h-3"/> Timbre Oficial
            </button>
          </div>

          {/* Textarea */}
          <div className="flex items-end gap-2 px-4 py-3">
            {/* Botão de anexo */}
            <div className="relative flex-shrink-0" ref={attachMenuRef}>
              <button
                onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border hover:bg-gray-50 transition-colors"
                style={{ borderColor: '#e5e7eb', color: '#888' }}>
                <Paperclip className="w-4 h-4"/>
              </button>
              {attachMenuOpen && (
                <div className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-2xl border p-2 w-60 z-50" style={{ borderColor: '#e5e7eb' }}>
                  {showUrlInput ? (
                    <div className="p-2">
                      <input autoFocus value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                        placeholder="https://..."
                        className="w-full text-xs border rounded-xl px-3 py-2 outline-none" style={{ borderColor: '#d1d5db' }}/>
                      <div className="flex gap-1 mt-2">
                        <button onClick={handleAddUrl} className="flex-1 text-xs py-1.5 rounded-xl text-white font-medium" style={{ background: '#0f2044' }}>Adicionar</button>
                        <button onClick={() => setShowUrlInput(false)} className="px-3 text-xs py-1.5 rounded-xl bg-gray-100 text-gray-600">✕</button>
                      </div>
                    </div>
                  ) : (
                    ATTACH_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => handleAttachOption(opt.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${opt.bg} ${opt.color} flex-shrink-0`}>{opt.icon}</div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{opt.label}</p>
                          <p className="text-[10px] text-gray-400">{opt.sub}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isLoading) sendMessage() }
              }}
              placeholder={selectedAgent ? `Mensagem para ${selectedAgent.emoji} ${selectedAgent.name}…` : "Selecione um agente abaixo e faça sua pergunta… (Enter para enviar)"}
              rows={1}
              className="flex-1 resize-none text-sm outline-none"
              style={{ background: 'transparent', lineHeight: '1.5', maxHeight: '180px', color: '#222222' }}
            />

            <button
              onClick={sendMessage}
              disabled={isLoading || !prompt.trim() || !selectedAgent}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
              style={{
                background: isLoading || !prompt.trim() || !selectedAgent ? '#e5e7eb' : '#D4A017',
                color: isLoading || !prompt.trim() || !selectedAgent ? '#aaa' : '#0f2044',
              }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] mt-2" style={{ color: '#aaaaaa' }}>
          Shift+Enter para nova linha &nbsp;·&nbsp; Enter para enviar
        </p>
      </div>

      {/* ── Carrossel de agentes ── */}
      <div className="mt-6 px-4 w-full max-w-4xl mx-auto flex-1 overflow-hidden">
        {/* Filtros + navegação */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            {(['all','growth','juris'] as const).map(p => (
              <button key={p}
                onClick={() => { setFilterProject(p); setCarouselIdx(0) }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filterProject === p ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'}`}
                style={filterProject === p ? { background: p === 'growth' ? '#059669' : p === 'juris' ? '#1d4ed8' : '#0f2044' } : {}}>
                {p === 'all' ? `Todos (${ECOSYSTEM_AGENTS.length})` : p === 'growth' ? `Growth (10)` : `Juris (28)`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{carouselIdx + 1} / {totalSlides}</span>
            <button onClick={() => setCarouselIdx(i => Math.max(0, i-1))} disabled={carouselIdx === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e5e7eb' }}>
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500"/>
            </button>
            <button onClick={() => setCarouselIdx(i => Math.min(totalSlides-1, i+1))} disabled={carouselIdx >= totalSlides-1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border disabled:opacity-30 hover:bg-gray-50 transition-colors" style={{ borderColor: '#e5e7eb' }}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500"/>
            </button>
          </div>
        </div>

        {/* Slides */}
        <div className="grid grid-cols-5 gap-3">
          {visibleAgents.map(agent => (
            <button key={agent.id}
              onClick={() => startConversation(agent)}
              className="flex flex-col items-center p-3 rounded-2xl border hover:shadow-md transition-all text-center group"
              style={{ background: '#ffffff', borderColor: '#e5e7eb' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-2 transition-transform group-hover:scale-110"
                style={{ background: agent.color + '18', border: `1.5px solid ${agent.color}35` }}>
                {agent.emoji}
              </div>
              <p className="text-[11px] font-semibold leading-tight mb-1 line-clamp-2" style={{ color: '#222222' }}>{agent.name}</p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${agent.project === 'growth' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {agent.project === 'growth' ? 'Growth' : 'Juris'}
              </span>
              <span className={`mt-1 text-[9px] px-1.5 py-0.5 rounded font-medium ${agent.modelBadge}`}>
                {agent.model.replace('Claude ', '').replace('GPT-', 'GPT-')}
              </span>
            </button>
          ))}
          {/* Preenche espaços vazios */}
          {Array.from({ length: CARDS_PER_SLIDE - visibleAgents.length }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-2xl" style={{ background: '#fafafa', border: '1.5px dashed #e5e7eb' }}/>
          ))}
        </div>

        {/* Dots de navegação */}
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button key={i} onClick={() => setCarouselIdx(i)}
              className={`rounded-full transition-all ${i === carouselIdx ? 'w-5 h-2' : 'w-2 h-2'}`}
              style={{ background: i === carouselIdx ? '#D4A017' : '#d1d5db' }}/>
          ))}
        </div>
      </div>

      {/* Hidden inputs */}
      <input ref={fileInputRef}  type="file" multiple accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.eml" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
      <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
      <input ref={audioInputRef} type="file" multiple accept="audio/*" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
    </div>
  )

  // ══════════════════════════════════════════════════════════════
  // RENDER: CHAT ATIVO (agente selecionado)
  // ══════════════════════════════════════════════════════════════
  const renderChat = () => {
    const currentConv = conversations.find(c => c.id === activeConvId)
    if (!selectedAgent || !activeConvId) return renderWelcome()

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">

        {/* ── Header do agente ── */}
        <div className="flex items-center gap-3 px-6 py-3 border-b" style={{ borderColor: '#f3f4f6', background: '#ffffff' }}>
          <button onClick={() => { setSelectedAgent(null); setActiveConvId(null) }}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400 mr-1">
            <ChevronLeft className="w-4 h-4"/>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: selectedAgent.color + '18', border: `1.5px solid ${selectedAgent.color}35` }}>
            {selectedAgent.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#222222' }}>{selectedAgent.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0 rounded font-medium ${selectedAgent.modelBadge}`}>{selectedAgent.model}</span>
              <span className={`text-[10px] px-1.5 py-0 rounded font-bold ${selectedAgent.project === 'growth' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {selectedAgent.project === 'growth' ? 'Growth Center' : 'Juris Center'}
              </span>
              <StatusDot status={selectedAgent.project === 'growth' ? ecoStatus.growth : ecoStatus.juris}/>
            </div>
          </div>
          <button onClick={() => startConversation(selectedAgent)} title="Nova conversa"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#e5e7eb', color: '#666' }}>
            <Plus className="w-3.5 h-3.5"/> Nova
          </button>
        </div>

        {/* ── Mensagens ── */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6" style={{ background: '#fafafa' }}>
          {(currentConv?.messages.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ background: selectedAgent.color + '15', border: `1.5px solid ${selectedAgent.color}30` }}>
                {selectedAgent.emoji}
              </div>
              <p className="text-base font-semibold mb-1" style={{ color: '#222222' }}>{selectedAgent.name}</p>
              <p className="text-sm max-w-sm" style={{ color: '#888888' }}>{selectedAgent.description}</p>
              <p className="text-xs mt-4 px-4 py-2 rounded-full" style={{ background: '#f3f4f6', color: '#888' }}>
                Digite sua mensagem abaixo para começar
              </p>
            </div>
          )}

          {(currentConv?.messages ?? []).map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-3xl mx-auto w-full`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base mr-3 flex-shrink-0 mt-0.5"
                  style={{ background: selectedAgent.color + '18' }}>
                  {selectedAgent.emoji}
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm shadow-sm'}`}
                style={msg.role === 'user'
                  ? { background: '#0f2044', color: '#ffffff' }
                  : { background: '#ffffff', border: '1px solid #e5e7eb', color: '#222222' }}>
                {msg.isLoading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: selectedAgent.color }}/>
                    <span className="text-sm text-gray-400">Processando…</span>
                  </div>
                ) : msg.role === 'user' ? (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.attachments.map(att => (
                          <span key={att.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
                            📎 {att.name.slice(0,20)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-sm leading-relaxed">
                      {msg.content.split('\n').map((line, li) => renderLine(line, li))}
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.modelUsed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{msg.modelUsed}</span>
                      )}
                      {msg.elapsed_ms && msg.elapsed_ms > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5"/>{(msg.elapsed_ms/1000).toFixed(1)}s
                        </span>
                      )}
                      <div className="ml-auto flex gap-1">
                        <button onClick={() => copyMessage(msg.id, msg.content)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          {copiedMsgId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500"/> : <Copy className="w-3.5 h-3.5"/>}
                        </button>
                        <button onClick={() => downloadDocument(msg.content, selectedAgent.name)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Download className="w-3.5 h-3.5"/>
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

        {/* ── Input do chat ── */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#f3f4f6', background: '#ffffff' }}>
          <div className="max-w-3xl mx-auto">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map(att => (
                  <span key={att.id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    📎 {att.name.slice(0,25)}
                    <button onClick={() => setAttachments(p => p.filter(a => a.id !== att.id))}><X className="w-3 h-3"/></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${useSearch ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                <Globe className="w-3 h-3"/> Web
              </button>
              <button onClick={() => setLetterheadMode(!letterheadMode)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${letterheadMode ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={letterheadMode ? { background: '#0f2044' } : {}}>
                <TrendingUp className="w-3 h-3"/> Timbre
              </button>
            </div>
            <div className="flex items-end gap-2 rounded-2xl border px-4 py-3 shadow-sm" style={{ borderColor: '#e5e7eb', background: '#ffffff' }}>
              <div className="relative flex-shrink-0" ref={attachMenuRef}>
                <button onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  style={{ color: '#888' }}>
                  <Paperclip className="w-4 h-4"/>
                </button>
                {attachMenuOpen && (
                  <div className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-2xl border p-2 w-60 z-50" style={{ borderColor: '#e5e7eb' }}>
                    {showUrlInput ? (
                      <div className="p-2">
                        <input autoFocus value={urlInput} onChange={e => setUrlInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                          placeholder="https://..." className="w-full text-xs border rounded-xl px-3 py-2 outline-none" style={{ borderColor: '#d1d5db' }}/>
                        <div className="flex gap-1 mt-2">
                          <button onClick={handleAddUrl} className="flex-1 text-xs py-1.5 rounded-xl text-white font-medium" style={{ background: '#0f2044' }}>Adicionar</button>
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
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isLoading) sendMessage() }
                }}
                placeholder={`Mensagem para ${selectedAgent.emoji} ${selectedAgent.name}… (Enter para enviar)`}
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none text-sm outline-none"
                style={{ background: 'transparent', maxHeight: '180px', lineHeight: '1.5', color: '#222222' }}
              />
              <button onClick={sendMessage} disabled={isLoading || !prompt.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
                style={{ background: isLoading || !prompt.trim() ? '#e5e7eb' : '#D4A017', color: isLoading || !prompt.trim() ? '#aaa' : '#0f2044' }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden inputs */}
        <input ref={fileInputRef}  type="file" multiple accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.eml" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
        <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
        <input ref={audioInputRef} type="file" multiple accept="audio/*" className="hidden" onChange={e => handleFileUpload(e.target.files)}/>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER FINAL
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="flex h-full overflow-hidden bg-white">
      {renderChat()}
    </div>
  )
}
