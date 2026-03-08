import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Paperclip, FileText,
  Sparkles, Scale, Megaphone, Cpu, Users,
  ChevronLeft, ChevronRight, Download, Copy, Check,
  X, Loader2, History, ChevronDown, Globe,
  Trash2, Mail, HardDrive, Link2,
  Mic, Camera, Activity, RefreshCw, AlertCircle, CheckCircle2,
  TrendingUp, Zap
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────
type Project      = 'growth' | 'juris'
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
  leads?: number
  lastCheck?: string
}

// ─── Agentes — IDs alinhados com APIs do Growth e Juris ───────
const ECOSYSTEM_AGENTS: Agent[] = [
  // ── Growth Center (9) ───────────────────────────────────────
  { id: 'ben-atendente',              name: 'BEN Atendente Jurídico',       emoji: '🤖', description: 'Qualificação de leads, triagem e atendimento 24/7. Suporte jurídico inicial.', model: 'Gemini 2.5 Flash', modelBadge: 'bg-green-100 text-green-800',   category: 'atendimento', project: 'growth', color: '#0f2044', active: true },
  { id: 'mara-ia',                    name: 'MARA — Secretária IA',          emoji: '👩‍💼', description: 'Agenda, notificações, triagem urgente e WhatsApp executivo.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'atendimento', project: 'growth', color: '#1e3470', active: true },
  { id: 'ben-conteudista',            name: 'BEN Conteudista Jurídico',      emoji: '✍️', description: 'Artigos jurídicos, posts e conteúdo institucional OAB-compliant.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'marketing', project: 'growth', color: '#7c3aed', active: true },
  { id: 'ben-estrategista-campanhas', name: 'BEN Estrategista de Campanhas', emoji: '📊', description: 'Análise de performance Meta Ads e Google Ads. ROI e KPIs.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'marketing', project: 'growth', color: '#059669', active: true },
  { id: 'ben-analista-relatorios',    name: 'BEN Analista de Relatórios',    emoji: '📈', description: 'Relatório semanal com insights de performance e métricas executivas.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'marketing', project: 'growth', color: '#d97706', active: true },
  { id: 'ben-analista-monitoramento', name: 'BEN Analista de Monitoramento', emoji: '🔍', description: 'Monitoramento de saúde do sistema e alertas críticos em tempo real.', model: 'Gemini 2.5 Flash', modelBadge: 'bg-green-100 text-green-800', category: 'sistema', project: 'growth', color: '#dc2626', active: true },
  { id: 'ben-estrategista-marketing', name: 'BEN Estrategista de Marketing', emoji: '📣', description: 'Redes sociais, Instagram, Reels e conteúdo OAB-compliant.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'marketing', project: 'growth', color: '#0369a1', active: true },
  { id: 'ben-diretor-criativo',       name: 'BEN Diretor Criativo',          emoji: '🎨', description: 'Identidade visual, branding jurídico e direção criativa institucional.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'marketing', project: 'growth', color: '#7c3aed', active: true },
  { id: 'ben-revisor-juridico',       name: 'BEN Revisor Jurídico',          emoji: '📝', description: 'Revisão técnica e linguística de peças jurídicas e documentos.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico', project: 'growth', color: '#374151', active: true },
  // ── Juris Center — Core (16) ─────────────────────────────────
  { id: 'ben-super-agente-juridico',  name: 'BEN Super Agente Jurídico ⭐',  emoji: '🌟', description: 'Coordenação estratégica multidisciplinar — o mais poderoso do ecossistema (Claude Opus 4.6).', model: 'Claude Opus 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'juridico', project: 'juris', color: '#92400e', active: true },
  { id: 'ben-peticionista-juridico',  name: 'BEN Peticionista Jurídico',     emoji: '⚖️', description: 'Peças processuais elaboradas conforme o caso concreto e jurisprudência atual.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#1d4ed8', active: true },
  { id: 'ben-contratualista',         name: 'BEN Contratualista',            emoji: '📋', description: 'Contratos empresariais, NDAs, societários e documentos negociais.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-mandatario-juridico',    name: 'BEN Mandatário Jurídico',       emoji: '📜', description: 'Procurações Ad Judicia, gerais, especiais e substabelecimentos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#059669', active: true },
  { id: 'ben-analista-processual',    name: 'BEN Analista Processual',       emoji: '🔬', description: 'Análise estratégica de processos com avaliação de risco e prognóstico.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'juridico', project: 'juris', color: '#dc2626', active: true },
  { id: 'ben-auditor-processual',     name: 'BEN Auditor Processual',        emoji: '🔏', description: 'Auditoria de prazos críticos, conformidade OAB e gestão de risco.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'juridico', project: 'juris', color: '#0f766e', active: true },
  { id: 'ben-gestor-juridico',        name: 'BEN Gestor Jurídico',           emoji: '🏢', description: 'Gestão de escritório, produtividade jurídica e governança operacional.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico', project: 'juris', color: '#374151', active: true },
  { id: 'ben-tributarista',           name: 'BEN Tributarista',              emoji: '💰', description: 'Direito tributário, planejamento fiscal e teses tributárias avançadas.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico', project: 'juris', color: '#d97706', active: true },
  { id: 'ben-trabalhista',            name: 'BEN Trabalhista',               emoji: '👷', description: 'Direito do trabalho, TST, reclamações e acordos trabalhistas.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico', project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-previdenciarista',       name: 'BEN Previdenciarista',          emoji: '🏛️', description: 'Benefícios INSS, aposentadorias, revisões previdenciárias e planejamento.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'juridico', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-pesquisador-juridico',   name: 'BEN Pesquisador Jurídico',      emoji: '🔎', description: 'Pesquisa em tempo real: STF, STJ, TRF, TJPI com citações precisas.', model: 'Perplexity llama-3.1', modelBadge: 'bg-indigo-100 text-indigo-800', category: 'juridico', project: 'juris', color: '#6d28d9', active: true },
  { id: 'ben-especialista-compliance',name: 'BEN Especialista Compliance',   emoji: '🛡️', description: 'Conformidade LGPD, políticas de privacidade e proteção de dados.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico', project: 'juris', color: '#0f766e', active: true },
  { id: 'ben-relator-juridico',       name: 'BEN Relator Jurídico',          emoji: '📚', description: 'Artigos jurídicos, pareceres técnicos e publicações institucionais.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico', project: 'juris', color: '#1e40af', active: true },
  { id: 'ben-redator-juridico',       name: 'BEN Redator Jurídico',          emoji: '✒️', description: 'Redação técnica jurídica, memorandos, ofícios e comunicações formais.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'juridico', project: 'juris', color: '#374151', active: true },
  { id: 'ben-constitucionalista',     name: 'BEN Constitucionalista',        emoji: '⚡', description: 'MS, HC, Mandado de Injunção, ações constitucionais e STF.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'juridico', project: 'juris', color: '#b91c1c', active: true },
  { id: 'ben-engenheiro-prompt',      name: 'BEN Engenheiro de Prompt',      emoji: '🧠', description: 'Otimização de prompts, configuração de agentes e arquitetura IA.', model: 'GPT-4o', modelBadge: 'bg-blue-100 text-blue-800', category: 'sistema', project: 'juris', color: '#4f46e5', active: true },
  // ── Juris Center — Contador Tributarista (6) ─────────────────
  { id: 'ben-contador-tributarista',             name: 'BEN Contador — Triagem',         emoji: '🧮', description: 'Triagem fiscal: classifica demanda e encaminha ao especialista correto.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#92400e', active: true },
  { id: 'ben-contador-tributarista-especialista',name: 'BEN Contador — Especialista',    emoji: '📊', description: 'Análise fiscal profunda com Claude Sonnet 4.6 — planejamento tributário avançado.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'contador', project: 'juris', color: '#b45309', active: true },
  { id: 'ben-contador-tributarista-planejamento',name: 'BEN Contador — Planejamento',    emoji: '🗺️', description: 'Planejamento tributário estratégico, elisão fiscal e otimização de carga.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'contador', project: 'juris', color: '#d97706', active: true },
  { id: 'ben-contador-tributarista-creditos',    name: 'BEN Contador — Créditos',        emoji: '💳', description: 'Recuperação de créditos tributários, compensações e restituições.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#059669', active: true },
  { id: 'ben-contador-tributarista-auditoria',   name: 'BEN Contador — Auditoria',       emoji: '🔍', description: 'Auditoria fiscal, conformidade tributária e gestão de risco fiscal.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'contador', project: 'juris', color: '#dc2626', active: true },
  { id: 'ben-contador-tributarista-relatorio',   name: 'BEN Contador — Relatório',       emoji: '📋', description: 'Relatórios fiscais executivos, dashboards tributários e sínteses gerenciais.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'contador', project: 'juris', color: '#0369a1', active: true },
  // ── Juris Center — Perito Forense (6) ────────────────────────
  { id: 'ben-perito-forense',          name: 'BEN Perito Forense — Padrão',   emoji: '🔬', description: 'Análise pericial padrão com Claude Sonnet 4.6 — laudos e pareceres técnicos.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'perito', project: 'juris', color: '#4f46e5', active: true },
  { id: 'ben-perito-forense-profundo', name: 'BEN Perito Forense — Profundo ⚠️', emoji: '🧬', description: 'Análise pericial profunda com Claude Opus 4.6 — alto custo, máxima precisão.', model: 'Claude Opus 4.6', modelBadge: 'bg-red-100 text-red-800', category: 'perito', project: 'juris', color: '#b91c1c', active: true },
  { id: 'ben-perito-forense-digital',  name: 'BEN Perito Forense Digital',    emoji: '💻', description: 'Perícia digital, análise de evidências eletrônicas e cibersegurança forense.', model: 'Claude Sonnet 4.6', modelBadge: 'bg-yellow-100 text-yellow-800', category: 'perito', project: 'juris', color: '#7c3aed', active: true },
  { id: 'ben-perito-forense-laudo',    name: 'BEN Perito Forense — Laudo',    emoji: '📄', description: 'Elaboração de laudos periciais técnicos para processos judiciais.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#0369a1', active: true },
  { id: 'ben-perito-forense-contestar',name: 'BEN Perito — Contraditório',    emoji: '🛡️', description: 'Contestação de laudos periciais adversariais e quesitos técnicos.', model: 'Claude Haiku 4.5', modelBadge: 'bg-orange-100 text-orange-800', category: 'perito', project: 'juris', color: '#059669', active: true },
  { id: 'ben-perito-forense-relatorio',name: 'BEN Perito Forense — Relatório',emoji: '📊', description: 'Relatórios periciais executivos e sínteses técnicas para clientes.', model: 'Gemini 2.5 Pro', modelBadge: 'bg-purple-100 text-purple-800', category: 'perito', project: 'juris', color: '#374151', active: true },
]

const CATEGORY_ICONS: Record<AgentCategory, React.ReactNode> = {
  atendimento: <Users className="w-3.5 h-3.5" />,
  juridico:    <Scale className="w-3.5 h-3.5" />,
  marketing:   <Megaphone className="w-3.5 h-3.5" />,
  sistema:     <Cpu className="w-3.5 h-3.5" />,
  contador:    <Zap className="w-3.5 h-3.5" />,
  perito:      <TrendingUp className="w-3.5 h-3.5" />,
}

// ─── Opções de anexo ──────────────────────────────────────────
const ATTACH_OPTIONS = [
  { id: 'file',  icon: <FileText className="w-4 h-4" />, label: 'Arquivo',       sub: 'PDF, Word, Excel, TXT', color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { id: 'image', icon: <Camera   className="w-4 h-4" />, label: 'Imagem/Foto',   sub: 'JPG, PNG, WebP',        color: 'text-green-600',  bg: 'bg-green-50'  },
  { id: 'email', icon: <Mail     className="w-4 h-4" />, label: 'E-mail',         sub: 'Importar .eml',         color: 'text-red-500',    bg: 'bg-red-50'    },
  { id: 'drive', icon: <HardDrive className="w-4 h-4"/>, label: 'Drive / Nuvem', sub: 'Google Drive, OneDrive',color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'url',   icon: <Link2    className="w-4 h-4" />, label: 'Link / URL',     sub: 'Página web ou doc',     color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'audio', icon: <Mic      className="w-4 h-4" />, label: 'Áudio',          sub: 'MP3, M4A, transcrição', color: 'text-pink-600',   bg: 'bg-pink-50'   },
]

// ─── Status Badge ─────────────────────────────────────────────
function StatusDot({ status }: { status: ModuleStatus }) {
  const map: Record<ModuleStatus, string> = {
    online:   'bg-green-400',
    offline:  'bg-red-500',
    degraded: 'bg-yellow-400',
    checking: 'bg-gray-400 animate-pulse',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status]}`} />
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function EcosystemWorkspace() {
  const [selectedAgent, setSelectedAgent]   = useState<Agent | null>(null)
  const [activeProject, setActiveProject]   = useState<Project | 'both'>('both')
  const [activeCategory, setActiveCategory] = useState<AgentCategory | 'all'>('all')
  const [conversations, setConversations]   = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId]     = useState<string | null>(null)
  const [prompt, setPrompt]                 = useState('')
  const [attachments, setAttachments]       = useState<Attachment[]>([])
  const [isLoading, setIsLoading]           = useState(false)
  const [sidebarOpen, setSidebarOpen]       = useState(true)
  const [historyOpen, setHistoryOpen]       = useState(false)
  const [useSearch, setUseSearch]           = useState(false)
  const [letterheadMode, setLetterheadMode] = useState(false)
  const [copiedMsgId, setCopiedMsgId]       = useState<string | null>(null)
  const [dragOver, setDragOver]             = useState(false)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [urlInput, setUrlInput]             = useState('')
  const [showUrlInput, setShowUrlInput]     = useState(false)
  const [ecoStatus, setEcoStatus]           = useState<EcosystemStatus>({
    growth: 'checking', juris: 'checking', vps: 'checking',
  })
  const [statusOpen, setStatusOpen]         = useState(false)

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  // ── Verificar status do ecossistema ──────────────────────────
  const checkStatus = useCallback(async () => {
    setEcoStatus(s => ({ ...s, growth: 'checking', juris: 'checking', vps: 'checking' }))
    try {
      const r = await fetch('/api/bridge?action=status', { signal: AbortSignal.timeout(12000) })
      if (r.ok) {
        const data = await r.json()
        setEcoStatus({
          growth:    data.modulos?.growth?.status || 'offline',
          juris:     data.modulos?.juris?.status  || 'offline',
          vps:       data.modulos?.vps?.status    || 'offline',
          leads:     data.modulos?.vps?.leads,
          lastCheck: new Date().toLocaleTimeString('pt-BR'),
        })
        return
      }
    } catch { /* silencioso */ }
    setEcoStatus({ growth: 'offline', juris: 'offline', vps: 'offline', lastCheck: new Date().toLocaleTimeString('pt-BR') })
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false); setShowUrlInput(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeConv?.messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [prompt])

  const filteredAgents = ECOSYSTEM_AGENTS.filter(a => {
    const projMatch = activeProject === 'both' || a.project === activeProject || a.project === 'both'
    const catMatch  = activeCategory === 'all'  || a.category === activeCategory
    return projMatch && catMatch
  })

  // ── Nova conversa ─────────────────────────────────────────────
  const startConversation = useCallback((agent: Agent) => {
    setSelectedAgent(agent)
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: `${agent.emoji} ${agent.name}`,
      agentId: agent.id,
      messages: [],
      createdAt: new Date(),
      project: agent.project,
    }
    setConversations(prev => [newConv, ...prev])
    setActiveConvId(newConv.id)
    setPrompt('')
    setAttachments([])
    setUseSearch(false)
    setLetterheadMode(false)
  }, [])

  // ── Upload ────────────────────────────────────────────────────
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        setAttachments(prev => [...prev, {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name, type: file.type, size: file.size,
          base64: e.target?.result as string,
        }])
      }
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  // ── Enviar mensagem (proxy /api/agents/run) ──────────────────
  const sendMessage = useCallback(async () => {
    const text = prompt.trim()
    if (!text || !selectedAgent || !activeConvId) return

    const attachmentText = attachments.length > 0
      ? '\n\n[ARQUIVOS/REFERÊNCIAS ANEXADOS]\n' + attachments.map(a =>
          a.type === 'text/url' ? `• URL: ${a.name}` : `• ${a.name} (${(a.size / 1024).toFixed(1)} KB)`
        ).join('\n')
      : ''

    const fullPrompt = text
      + attachmentText
      + (letterheadMode ? '\n\n[INSTRUÇÃO: Usar timbre oficial — Mauro Monção Advogados, Parnaíba-PI e Fortaleza-CE, OAB/PI.]' : '')

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }
    const loadingMsg: Message = {
      id: `msg-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      agentId: selectedAgent.id,
      agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
      timestamp: new Date(),
      isLoading: true,
    }

    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c,
            messages: [...c.messages, userMsg, loadingMsg],
            title: c.messages.length === 0 ? text.slice(0, 50) + (text.length > 50 ? '…' : '') : c.title,
          }
        : c
    ))
    setPrompt('')
    setAttachments([])
    setIsLoading(true)

    try {
      // ── Usar proxy /api/agents/run do Ecosystem (rota local) ──
      const conv    = conversations.find(c => c.id === activeConvId)
      const history = (conv?.messages || [])
        .filter(m => !m.isLoading).slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: fullPrompt,
          context: { history, letterhead: letterheadMode },
          useSearch: useSearch || selectedAgent.id === 'ben-pesquisador-juridico',
          useMemory: false,
        }),
      })

      let resultText = ''
      let modelUsed  = ''
      let destino    = ''
      let elapsed    = 0

      if (response.ok) {
        const data = await response.json()
        resultText = data.output || data.result || data.resposta || data.content || JSON.stringify(data)
        modelUsed  = data.modelUsed || data.model || ''
        destino    = data.destino   || ''
        elapsed    = data.elapsed_ms || 0
      } else {
        const errData = await response.json().catch(() => ({}))
        resultText = `⚠️ O agente **${selectedAgent.name}** está temporariamente indisponível (${response.status}).\n\n${errData.error || 'Verifique as configurações de API no Vercel.'}`
      }

      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
              id: `msg-${Date.now()}`, role: 'assistant', content: resultText,
              agentId: selectedAgent.id,
              agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
              timestamp: new Date(),
              modelUsed, destino, elapsed_ms: elapsed,
            }) }
          : c
      ))
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Erro desconhecido'
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
              id: `msg-err-${Date.now()}`, role: 'assistant',
              content: `⚠️ Não foi possível conectar ao agente **${selectedAgent.name}**.\n\nErro: ${errMsg}`,
              agentId: selectedAgent.id,
              agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
              timestamp: new Date(),
            }) }
          : c
      ))
    } finally {
      setIsLoading(false)
    }
  }, [prompt, selectedAgent, activeConvId, attachments, conversations, useSearch, letterheadMode])

  const copyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMsgId(msgId)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const downloadDocument = (content: string, agentName: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${agentName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Renderização markdown simples ─────────────────────────────
  const renderLine = (line: string, li: number) => {
    if (line.startsWith('### '))
      return <p key={li} className="font-bold text-sm mt-3 mb-1" style={{ color: '#222' }}>{line.slice(4)}</p>
    if (line.startsWith('## '))
      return <p key={li} className="font-bold mt-3 mb-1" style={{ color: '#222' }}>{line.slice(3)}</p>
    if (line.startsWith('# '))
      return <p key={li} className="font-extrabold text-base mt-3 mb-2" style={{ color: '#222' }}>{line.slice(2)}</p>
    if (line.startsWith('---'))
      return <hr key={li} className="my-2 border-gray-200" />
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
      return <p key={li} className="ml-3 mb-0.5 flex gap-2"><span style={{ color: '#888' }}>•</span><span style={{ color: '#222' }}>{line.slice(2)}</span></p>
    if (/^\d+\.\s/.test(line))
      return <p key={li} className="ml-3 mb-0.5" style={{ color: '#222' }}>{line}</p>
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{ color: '#111' }}>{p.slice(2, -2)}</strong>
        : p
    )
    return <p key={li} className={line === '' ? 'mb-2' : 'mb-0.5'} style={{ color: '#222' }}>{rendered}</p>
  }

  // ══════════════════════════════════════════════════════════════
  // SIDEBAR
  // ══════════════════════════════════════════════════════════════
  const renderSidebar = () => (
    <div
      className={`flex flex-col border-r transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-72' : 'w-14'}`}
      style={{ background: '#0f2044', borderColor: '#1a3060' }}
    >
      {/* Topo */}
      <div className="flex items-center justify-between px-3 py-3 border-b" style={{ borderColor: '#1a3060' }}>
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#D4A017' }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">BEN ECOSYSTEM</p>
              <p className="text-[10px]" style={{ color: '#D4A017' }}>IA Workspace • {ECOSYSTEM_AGENTS.length} agentes</p>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors ml-auto">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {sidebarOpen && (
        <>
          {/* Status do Ecossistema */}
          <div className="px-3 py-2 border-b" style={{ borderColor: '#1a3060' }}>
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="w-full flex items-center gap-2 text-[11px] text-gray-400 hover:text-white transition-colors"
            >
              <Activity className="w-3 h-3" />
              <span>Status do Ecossistema</span>
              <div className="flex gap-1 ml-auto">
                <StatusDot status={ecoStatus.growth} />
                <StatusDot status={ecoStatus.juris} />
                <StatusDot status={ecoStatus.vps} />
              </div>
              <RefreshCw
                className="w-3 h-3 ml-1 cursor-pointer hover:text-yellow-400"
                onClick={e => { e.stopPropagation(); checkStatus() }}
              />
            </button>
            {statusOpen && (
              <div className="mt-2 space-y-1 text-[10px]">
                {[
                  { label: 'Growth Center', key: 'growth' as const, url: 'bengrowth.mauromoncao.adv.br' },
                  { label: 'Juris Center',  key: 'juris'  as const, url: 'juris.mauromoncao.adv.br'     },
                  { label: 'VPS Hostinger', key: 'vps'    as const, url: '181.215.135.202:3001'          },
                ].map(({ label, key, url }) => (
                  <div key={key} className="flex items-center justify-between px-2 py-1 rounded" style={{ background: '#081530' }}>
                    <span className="text-gray-400">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {key === 'vps' && ecoStatus.leads !== undefined && (
                        <span className="text-gray-500">{ecoStatus.leads} leads</span>
                      )}
                      <StatusDot status={ecoStatus[key]} />
                      <span className={
                        ecoStatus[key] === 'online'   ? 'text-green-400' :
                        ecoStatus[key] === 'offline'  ? 'text-red-400'   :
                        ecoStatus[key] === 'degraded' ? 'text-yellow-400': 'text-gray-400'
                      }>{ecoStatus[key]}</span>
                    </div>
                  </div>
                ))}
                {ecoStatus.lastCheck && (
                  <p className="text-[9px] text-gray-600 px-1">Verificado às {ecoStatus.lastCheck}</p>
                )}
              </div>
            )}
          </div>

          {/* Filtro Projeto */}
          <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: '#1a3060' }}>
            <div className="flex rounded-lg overflow-hidden" style={{ background: '#081530' }}>
              {(['both', 'growth', 'juris'] as const).map(p => (
                <button key={p} onClick={() => setActiveProject(p)}
                  className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${activeProject === p ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                  style={activeProject === p ? { background: '#D4A017' } : {}}
                >
                  {p === 'both' ? 'Todos' : p === 'growth' ? 'Growth' : 'Juris'}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Categoria */}
          <div className="px-3 py-2 border-b" style={{ borderColor: '#1a3060' }}>
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setActiveCategory('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${activeCategory === 'all' ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                style={activeCategory === 'all' ? { background: '#D4A017' } : {}}
              >Todos</button>
              {(['atendimento', 'juridico', 'marketing', 'sistema', 'contador', 'perito'] as AgentCategory[]).map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${activeCategory === cat ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  style={activeCategory === cat ? { background: '#1a3060' } : {}}
                >
                  {CATEGORY_ICONS[cat]}
                  {cat === 'atendimento' ? 'CRM' : cat === 'juridico' ? 'Jurídico' : cat === 'marketing' ? 'Marketing' : cat === 'sistema' ? 'Sistema' : cat === 'contador' ? 'Contador' : 'Perito'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Agentes */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {filteredAgents.map(agent => (
              <button key={agent.id} onClick={() => startConversation(agent)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${selectedAgent?.id === agent.id && activeConv ? 'bg-white/15 ring-1 ring-white/20' : 'hover:bg-white/8'}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: agent.color + '33', border: `1px solid ${agent.color}55` }}>
                    {agent.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{agent.name}</p>
                    <span className={`inline-flex mt-0.5 px-1.5 py-0 rounded text-[10px] font-medium ${agent.modelBadge}`}>
                      {agent.model}
                    </span>
                  </div>
                  {/* Indicador de módulo */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    agent.project === 'growth' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                  }`}>
                    {agent.project === 'growth' ? 'G' : 'J'}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Histórico */}
          <div className="border-t px-2 py-2" style={{ borderColor: '#1a3060' }}>
            <button onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
              <History className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Histórico ({conversations.length})</span>
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${historyOpen ? 'rotate-180' : ''}`} />
            </button>
            {historyOpen && conversations.length > 0 && (
              <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                {conversations.slice(0, 20).map(conv => (
                  <button key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id)
                      const a = ECOSYSTEM_AGENTS.find(a => a.id === conv.agentId)
                      if (a) setSelectedAgent(a)
                    }}
                    className={`w-full text-left px-3 py-1 rounded-lg text-[11px] truncate transition-colors ${activeConvId === conv.id ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  >{conv.title}</button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Sidebar recolhida */}
      {!sidebarOpen && (
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
          {filteredAgents.map(agent => (
            <button key={agent.id}
              onClick={() => startConversation(agent)}
              title={agent.name}
              className={`w-full h-10 rounded-lg flex items-center justify-center text-base transition-all ${selectedAgent?.id === agent.id && activeConv ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              {agent.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════════
  // ÁREA DE CHAT
  // ══════════════════════════════════════════════════════════════
  const renderChat = () => {
    if (!selectedAgent || !activeConv) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: '#f8f9fb' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#0f2044' }}>Ben Ecosystem IA</h2>
          <p className="text-sm text-center max-w-md mb-6" style={{ color: '#666' }}>
            Workspace unificado com <strong>{ECOSYSTEM_AGENTS.length} agentes</strong> de IA —
            Growth Center (9) + Juris Center (28).
            Selecione um agente na barra lateral para começar.
          </p>
          {/* Cards rápidos */}
          <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
            {[
              { id: 'ben-atendente',             emoji: '🤖', name: 'BEN Atendente',      sub: 'Atendimento & Leads',       badge: 'Growth' },
              { id: 'ben-super-agente-juridico',  emoji: '🌟', name: 'BEN Super Agente',   sub: 'Coordenação jurídica ⭐',    badge: 'Juris'  },
              { id: 'ben-tributarista',           emoji: '💰', name: 'BEN Tributarista',   sub: 'Planejamento tributário',   badge: 'Juris'  },
              { id: 'ben-conteudista',            emoji: '✍️', name: 'BEN Conteudista',    sub: 'Artigos & SEO jurídico',    badge: 'Growth' },
            ].map(card => {
              const agent = ECOSYSTEM_AGENTS.find(a => a.id === card.id)
              if (!agent) return null
              return (
                <button key={card.id} onClick={() => startConversation(agent)}
                  className="p-3 rounded-xl border text-left hover:shadow-md transition-all"
                  style={{ background: '#fff', borderColor: '#e5e7eb' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{card.emoji}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      card.badge === 'Growth' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{card.badge}</span>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: '#0f2044' }}>{card.name}</p>
                  <p className="text-[11px]" style={{ color: '#888' }}>{card.sub}</p>
                </button>
              )
            })}
          </div>
          {/* Status resumido */}
          <div className="mt-6 flex gap-4 text-xs" style={{ color: '#888' }}>
            <span className="flex items-center gap-1.5">
              <StatusDot status={ecoStatus.growth} /> Growth
            </span>
            <span className="flex items-center gap-1.5">
              <StatusDot status={ecoStatus.juris} /> Juris
            </span>
            <span className="flex items-center gap-1.5">
              <StatusDot status={ecoStatus.vps} /> VPS
            </span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header do chat */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-white" style={{ borderColor: '#e5e7eb' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: selectedAgent.color + '22', border: `1px solid ${selectedAgent.color}44` }}>
            {selectedAgent.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#0f2044' }}>{selectedAgent.name}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0 rounded font-medium ${selectedAgent.modelBadge}`}>
                {selectedAgent.model}
              </span>
              <span className={`text-[10px] px-1.5 py-0 rounded font-bold ${
                selectedAgent.project === 'growth' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {selectedAgent.project === 'growth' ? 'Growth Center' : 'Juris Center'}
              </span>
              <StatusDot status={selectedAgent.project === 'growth' ? ecoStatus.growth : ecoStatus.juris} />
            </div>
          </div>
          <button onClick={() => startConversation(selectedAgent)}
            title="Nova conversa"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Mensagens */}
        <div
          className={`flex-1 overflow-y-auto p-4 space-y-4 ${dragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}`}
          style={{ background: '#f8f9fb' }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {activeConv.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                style={{ background: selectedAgent.color + '22' }}>
                {selectedAgent.emoji}
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#0f2044' }}>{selectedAgent.name}</p>
              <p className="text-xs max-w-xs" style={{ color: '#888' }}>{selectedAgent.description}</p>
              <p className="text-[11px] mt-3 px-3 py-1 rounded-full" style={{ background: '#e5e7eb', color: '#666' }}>
                Digite sua mensagem abaixo para começar
              </p>
            </div>
          )}

          {activeConv.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5"
                  style={{ background: selectedAgent.color + '22' }}>
                  {selectedAgent.emoji}
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : 'rounded-tl-sm shadow-sm'
              }`}
                style={msg.role === 'user'
                  ? { background: '#0f2044' }
                  : { background: '#ffffff', border: '1px solid #e5e7eb' }
                }
              >
                {msg.isLoading ? (
                  <div className="flex items-center gap-2 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: selectedAgent.color }} />
                    <span className="text-xs" style={{ color: '#888' }}>Processando...</span>
                  </div>
                ) : msg.role === 'user' ? (
                  <>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.attachments.map(att => (
                          <span key={att.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white">
                            📎 {att.name.slice(0, 20)}
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
                    {/* Footer da mensagem */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.modelUsed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {msg.modelUsed}
                        </span>
                      )}
                      {msg.destino && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          msg.destino === 'growth' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {msg.destino === 'growth' ? 'Growth' : 'Juris'}
                        </span>
                      )}
                      {msg.elapsed_ms && msg.elapsed_ms > 0 && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" />{(msg.elapsed_ms / 1000).toFixed(1)}s
                        </span>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <button onClick={() => copyMessage(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button onClick={() => downloadDocument(msg.content, selectedAgent.name)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t p-3" style={{ borderColor: '#e5e7eb' }}>
          {/* Opções de contexto */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <button onClick={() => setUseSearch(!useSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                useSearch ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              style={useSearch ? { background: '#6d28d9', color: '#fff' } : {}}>
              <Globe className="w-3 h-3" />
              Pesquisa Web
            </button>
            <button onClick={() => setLetterheadMode(!letterheadMode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                letterheadMode ? 'text-white' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
              }`}
              style={letterheadMode ? { background: '#0f2044', color: '#fff' } : {}}>
              <TrendingUp className="w-3 h-3" />
              Timbre Oficial
            </button>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {attachments.map(att => (
                  <span key={att.id} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    📎 {att.name.slice(0, 20)}
                    <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Área de texto */}
          <div className="flex gap-2 items-end">
            {/* Botão de anexo */}
            <div className="relative" ref={attachMenuRef}>
              <button onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border hover:bg-gray-50 transition-colors flex-shrink-0"
                style={{ borderColor: '#e5e7eb', color: '#888' }}>
                <Paperclip className="w-4 h-4" />
              </button>
              {attachMenuOpen && (
                <div className="absolute bottom-11 left-0 bg-white rounded-2xl shadow-xl border p-2 w-56 z-50"
                  style={{ borderColor: '#e5e7eb' }}>
                  {showUrlInput ? (
                    <div className="p-2">
                      <input autoFocus value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                        placeholder="https://..." className="w-full text-xs border rounded-lg px-2 py-1.5 outline-none"
                        style={{ borderColor: '#d1d5db' }} />
                      <div className="flex gap-1 mt-1">
                        <button onClick={handleAddUrl} className="flex-1 text-xs py-1 rounded-lg text-white" style={{ background: '#0f2044' }}>Adicionar</button>
                        <button onClick={() => setShowUrlInput(false)} className="px-2 text-xs py-1 rounded-lg bg-gray-100 text-gray-600">✕</button>
                      </div>
                    </div>
                  ) : (
                    ATTACH_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => handleAttachOption(opt.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${opt.bg} ${opt.color} flex-shrink-0`}>
                          {opt.icon}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{opt.label}</p>
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!isLoading) sendMessage()
                }
              }}
              placeholder={`Mensagem para ${selectedAgent.emoji} ${selectedAgent.name}… (Enter para enviar)`}
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                borderColor: '#e5e7eb',
                background: isLoading ? '#f9fafb' : '#fff',
                maxHeight: '200px',
                lineHeight: '1.4',
              }}
            />

            <button
              onClick={sendMessage}
              disabled={isLoading || !prompt.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0"
              style={{
                background: isLoading || !prompt.trim() ? '#e5e7eb' : '#D4A017',
                color: isLoading || !prompt.trim() ? '#aaa' : '#0f2044',
              }}
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          {/* Inputs hidden */}
          <input ref={fileInputRef}  type="file" multiple accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.eml" className="hidden" onChange={e => handleFileUpload(e.target.files)} />
          <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e.target.files)} />
          <input ref={audioInputRef} type="file" multiple accept="audio/*" className="hidden" onChange={e => handleFileUpload(e.target.files)} />
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER FINAL
  // ══════════════════════════════════════════════════════════════
  return (
    <div
      className="flex h-full rounded-xl overflow-hidden shadow-sm border"
      style={{ borderColor: '#e5e7eb' }}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {renderSidebar()}
      {renderChat()}
    </div>
  )
}
