import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Paperclip, FileText, Image as ImageIcon,
  Sparkles, Scale, Megaphone, Cpu, Users,
  ChevronLeft, ChevronRight, Download, Copy, Check,
  Plus, X, Loader2, History, ChevronDown, Globe,
  ScrollText, Trash2, Mail, HardDrive, Link2,
  FolderOpen, AtSign, Cloud, Mic, Camera
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────
type Project = 'growth' | 'juris'
type AgentCategory = 'atendimento' | 'juridico' | 'marketing' | 'sistema'

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
}

interface Conversation {
  id: string
  title: string
  agentId: string
  messages: Message[]
  createdAt: Date
  project: Project | 'both'
}

// ─── Agentes ──────────────────────────────────────────────────
const ECOSYSTEM_AGENTS: Agent[] = [
  { id: 'dr-ben',               name: 'Dr. Ben Atendimento',      emoji: '🤖', description: 'Qualificação de leads, triagem e atendimento 24/7.',            model: 'GPT-4o-mini',        modelBadge: 'bg-green-100 text-green-800',   category: 'atendimento', project: 'growth', color: '#0f2044', active: true },
  { id: 'mara-ia',              name: 'MARA — Secretária IA',      emoji: '👩‍💼', description: 'Agenda, notificações, triagem urgente e WhatsApp executivo.',   model: 'GPT-4o',             modelBadge: 'bg-blue-100 text-blue-800',     category: 'atendimento', project: 'growth', color: '#1e3470', active: true },
  { id: 'lex-conteudo',         name: 'Lex Conteúdo',              emoji: '✍️', description: 'Artigos jurídicos, posts e conteúdo institucional OAB.',         model: 'GPT-4o',             modelBadge: 'bg-green-100 text-green-800',   category: 'marketing',   project: 'growth', color: '#7c3aed', active: true },
  { id: 'lex-campanhas',        name: 'Lex Campanhas',             emoji: '📊', description: 'Análise de performance Meta Ads e Google Ads.',                  model: 'GPT-4o',             modelBadge: 'bg-green-100 text-green-800',   category: 'marketing',   project: 'growth', color: '#059669', active: true },
  { id: 'lex-relatorio',        name: 'Lex Relatório',             emoji: '📈', description: 'Relatório semanal com insights de performance e KPIs.',          model: 'GPT-4o',             modelBadge: 'bg-green-100 text-green-800',   category: 'marketing',   project: 'growth', color: '#d97706', active: true },
  { id: 'lex-monitor',          name: 'Lex Monitor',               emoji: '🔍', description: 'Monitoramento de saúde do sistema e alertas críticos.',          model: 'GPT-4o-mini',        modelBadge: 'bg-green-100 text-green-800',   category: 'sistema',     project: 'growth', color: '#dc2626', active: true },
  { id: 'dr-ben-peticoes',      name: 'Dr. Ben Petições',          emoji: '⚖️', description: 'Peças processuais elaboradas conforme o caso concreto.',         model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#92400e', active: true },
  { id: 'dr-ben-contratos',     name: 'Dr. Ben Contratos',         emoji: '📋', description: 'Contratos empresariais, NDAs e documentos societários.',         model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#1d4ed8', active: true },
  { id: 'dr-ben-procuracoes',   name: 'Dr. Ben Procurações',       emoji: '📜', description: 'Procurações Ad Judicia, gerais, especiais e substabelecimentos.', model: 'Claude Haiku 4.5',  modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#7c3aed', active: true },
  { id: 'dr-ben-analise-processo', name: 'Dr. Ben Análise Processual', emoji: '🔬', description: 'Análise estratégica de processos com avaliação de risco.',  model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#dc2626', active: true },
  { id: 'dr-ben-auditoria',     name: 'Dr. Ben Auditoria',         emoji: '🔏', description: 'Auditoria processual, prazos críticos e conformidade OAB.',      model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#059669', active: true },
  { id: 'dr-ben-fiscal',        name: 'Dr. Ben Fiscal/Tributário', emoji: '💰', description: 'Direito tributário, planejamento fiscal e teses tributárias.',   model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#d97706', active: true },
  { id: 'dr-ben-trabalhista',   name: 'Dr. Ben Trabalhista',       emoji: '👷', description: 'Direito do trabalho, TST, reclamações e acordos trabalhistas.',  model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#0369a1', active: true },
  { id: 'dr-ben-previdenciario',name: 'Dr. Ben Previdenciário',    emoji: '🏛️', description: 'Benefícios INSS, aposentadorias e revisões previdenciárias.',   model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#7c3aed', active: true },
  { id: 'dr-ben-pesquisa',      name: 'Dr. Ben Pesquisa Jurídica', emoji: '🔎', description: 'Pesquisa em tempo real: STF, STJ, TRF, TJPI com citações.',      model: 'Perplexity llama-3.1', modelBadge: 'bg-purple-100 text-purple-800', category: 'juridico', project: 'juris',  color: '#6d28d9', active: true },
  { id: 'dr-ben-compliance',    name: 'Dr. Ben Compliance/LGPD',   emoji: '🛡️', description: 'Conformidade LGPD, políticas de privacidade e dados.',           model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#0f766e', active: true },
  { id: 'dr-ben-producao',      name: 'Dr. Ben Produção Intelectual', emoji: '📚', description: 'Artigos jurídicos, pareceres técnicos e publicações.',       model: 'Claude Haiku 4.5',   modelBadge: 'bg-orange-100 text-orange-800', category: 'juridico',    project: 'juris',  color: '#1e40af', active: true },
]

const CATEGORY_ICONS: Record<AgentCategory, React.ReactNode> = {
  atendimento: <Users className="w-3.5 h-3.5" />,
  juridico:    <Scale className="w-3.5 h-3.5" />,
  marketing:   <Megaphone className="w-3.5 h-3.5" />,
  sistema:     <Cpu className="w-3.5 h-3.5" />,
}

// ─── Opções do menu de anexo expandido ────────────────────────
const ATTACH_OPTIONS = [
  { id: 'file',    icon: <FileText className="w-4 h-4" />,   label: 'Arquivo',        sub: 'PDF, Word, Excel, TXT',       color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { id: 'image',   icon: <Camera className="w-4 h-4" />,     label: 'Imagem/Foto',    sub: 'JPG, PNG, WebP',              color: 'text-green-600',  bg: 'bg-green-50'  },
  { id: 'email',   icon: <Mail className="w-4 h-4" />,       label: 'E-mail',         sub: 'Importar mensagem .eml',      color: 'text-red-500',    bg: 'bg-red-50'    },
  { id: 'drive',   icon: <HardDrive className="w-4 h-4" />,  label: 'Drive / Nuvem',  sub: 'Google Drive, OneDrive',      color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'url',     icon: <Link2 className="w-4 h-4" />,      label: 'Link / URL',     sub: 'Página web ou documento',     color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'audio',   icon: <Mic className="w-4 h-4" />,        label: 'Áudio',          sub: 'MP3, M4A, transcrição',       color: 'text-pink-600',   bg: 'bg-pink-50'   },
]

// ─── Componente Principal ─────────────────────────────────────
export default function EcosystemWorkspace() {
  const [selectedAgent, setSelectedAgent]     = useState<Agent | null>(null)
  const [activeProject, setActiveProject]     = useState<Project | 'both'>('both')
  const [activeCategory, setActiveCategory]   = useState<AgentCategory | 'all'>('all')
  const [conversations, setConversations]     = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId]       = useState<string | null>(null)
  const [prompt, setPrompt]                   = useState('')
  const [attachments, setAttachments]         = useState<Attachment[]>([])
  const [isLoading, setIsLoading]             = useState(false)
  const [sidebarOpen, setSidebarOpen]         = useState(true)
  const [historyOpen, setHistoryOpen]         = useState(false)
  const [useSearch, setUseSearch]             = useState(false)
  const [letterheadMode, setLetterheadMode]   = useState(false)
  const [copiedMsgId, setCopiedMsgId]         = useState<string | null>(null)
  const [dragOver, setDragOver]               = useState(false)
  const [attachMenuOpen, setAttachMenuOpen]   = useState(false)
  const [urlInput, setUrlInput]               = useState('')
  const [showUrlInput, setShowUrlInput]       = useState(false)

  const fileInputRef  = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef    = useRef<HTMLDivElement>(null)
  const textareaRef   = useRef<HTMLTextAreaElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  // Fechar menu de anexo ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false)
        setShowUrlInput(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages])

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

  // ── Nova conversa ────────────────────────────────────────────
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

  // ── Upload ───────────────────────────────────────────────────
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

  // ── Adicionar URL como "anexo" ───────────────────────────────
  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    setAttachments(prev => [...prev, {
      id: `url-${Date.now()}`,
      name: urlInput.trim(),
      type: 'text/url',
      size: 0,
    }])
    setUrlInput('')
    setShowUrlInput(false)
    setAttachMenuOpen(false)
  }

  // ── Clique em opção do menu de anexo ────────────────────────
  const handleAttachOption = (id: string) => {
    if (id === 'file')  { fileInputRef.current?.click();  setAttachMenuOpen(false) }
    if (id === 'image') { imageInputRef.current?.click(); setAttachMenuOpen(false) }
    if (id === 'audio') { audioInputRef.current?.click(); setAttachMenuOpen(false) }
    if (id === 'url')   { setShowUrlInput(true) }
    if (id === 'email') { fileInputRef.current?.click();  setAttachMenuOpen(false) } // .eml via file picker
    if (id === 'drive') {
      window.open('https://drive.google.com', '_blank')
      setAttachMenuOpen(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  // ── Enviar mensagem ──────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = prompt.trim()
    if (!text || !selectedAgent || !activeConvId) return

    const urlAttachments = attachments.filter(a => a.type === 'text/url')
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
      const isJurisAgent = selectedAgent.project === 'juris'
      const baseUrl = isJurisAgent
        ? 'https://ben-juris-center.vercel.app'
        : 'https://ben-growth-center.vercel.app'

      const conv = conversations.find(c => c.id === activeConvId)
      const history = (conv?.messages || [])
        .filter(m => !m.isLoading).slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          input: fullPrompt,
          context: { history, letterhead: letterheadMode },
          useSearch: useSearch || selectedAgent.id === 'dr-ben-pesquisa',
        }),
      })

      let resultText = ''
      if (response.ok) {
        const data = await response.json()
        resultText = data.output || data.result || data.resposta || data.content || JSON.stringify(data)
      } else {
        resultText = `⚠️ O agente **${selectedAgent.name}** está temporariamente indisponível. Verifique as configurações de API em *Configurações → Variáveis de Ambiente*.`
      }

      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
              id: `msg-${Date.now()}`, role: 'assistant', content: resultText,
              agentId: selectedAgent.id,
              agentName: `${selectedAgent.emoji} ${selectedAgent.name}`,
              timestamp: new Date(),
            }) }
          : c
      ))
    } catch {
      setConversations(prev => prev.map(c =>
        c.id === activeConvId
          ? { ...c, messages: c.messages.filter(m => !m.isLoading).concat({
              id: `msg-err-${Date.now()}`, role: 'assistant',
              content: `⚠️ Não foi possível conectar ao agente **${selectedAgent.name}**. Verifique sua conexão e as configurações de API.`,
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
    a.href     = url
    a.download = `${agentName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Renderização de markdown simples ─────────────────────────
  const renderLine = (line: string, li: number) => {
    if (line.startsWith('### '))
      return <p key={li} className="font-bold text-sm mt-3 mb-1" style={{ color: '#222222' }}>{line.slice(4)}</p>
    if (line.startsWith('## '))
      return <p key={li} className="font-bold mt-3 mb-1" style={{ color: '#222222' }}>{line.slice(3)}</p>
    if (line.startsWith('# '))
      return <p key={li} className="font-extrabold text-base mt-3 mb-2" style={{ color: '#222222' }}>{line.slice(2)}</p>
    if (line.startsWith('---'))
      return <hr key={li} className="my-2 border-gray-200" />
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
      return <p key={li} className="ml-3 mb-0.5 flex gap-2"><span style={{ color: '#888888' }}>•</span><span style={{ color: '#222222' }}>{line.slice(2)}</span></p>
    if (/^\d+\.\s/.test(line))
      return <p key={li} className="ml-3 mb-0.5" style={{ color: '#222222' }}>{line}</p>
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**') ? <strong key={i} style={{ color: '#111111' }}>{p.slice(2, -2)}</strong> : p
    )
    return <p key={li} className={line === '' ? 'mb-2' : 'mb-0.5'} style={{ color: '#222222' }}>{rendered}</p>
  }

  // ═══════════════════════════════════════════════════════════
  // ── SIDEBAR ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
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
              <p className="text-[10px]" style={{ color: '#D4A017' }}>IA Workspace</p>
            </div>
          </div>
        )}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors ml-auto">
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {sidebarOpen && (
        <>
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
              {(['atendimento', 'juridico', 'marketing', 'sistema'] as AgentCategory[]).map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${activeCategory === cat ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  style={activeCategory === cat ? { background: '#1a3060' } : {}}
                >
                  {CATEGORY_ICONS[cat]}
                  {cat === 'atendimento' ? 'CRM' : cat === 'juridico' ? 'Jurídico' : cat === 'marketing' ? 'Marketing' : 'Sistema'}
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
                    onClick={() => { setActiveConvId(conv.id); const a = ECOSYSTEM_AGENTS.find(a => a.id === conv.agentId); if (a) setSelectedAgent(a) }}
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
            <button key={agent.id} onClick={() => { setSidebarOpen(true); startConversation(agent) }}
              title={agent.name}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all mx-auto ${selectedAgent?.id === agent.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >{agent.emoji}</button>
          ))}
        </div>
      )}
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // ── WELCOME ─────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const renderWelcome = () => (
    <div className="flex-1 flex flex-col" style={{ background: '#FFFFFF' }}>

      {/* ── Título centralizado estilo Genspark ── */}
      <div className="flex flex-col items-center justify-center pt-12 pb-6 px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #0f2044, #1e3470)' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#D4A017' }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#0f2044' }}>
            Ben Ecosystem IA — Workspace
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#555555' }}>Mauro Monção Advogados Associados · {ECOSYSTEM_AGENTS.filter(a => a.active).length} agentes ativos</p>
      </div>

      {/* ── Caixa de input centralizada (estilo Genspark) ── */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pb-8"
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="w-full max-w-2xl">

          {/* Campo central — agente aparece dentro da caixa ao ser selecionado */}
          <div
            className="w-full rounded-2xl shadow-sm overflow-hidden"
            style={{ background: '#FFFFFF', border: `1.5px solid ${selectedAgent ? selectedAgent.color + '60' : '#D1D5DB'}` }}
          >
            {/* Agente ativo — aparece no topo da caixa ao selecionar */}
            {selectedAgent && (
              <div className="flex items-center gap-2 px-4 pt-3 pb-0 border-b" style={{ borderColor: '#F3F4F6' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: selectedAgent.color + '20' }}>
                  {selectedAgent.emoji}
                </div>
                <span className="text-xs font-bold" style={{ color: selectedAgent.color }}>{selectedAgent.name}</span>
                <span className={`px-1.5 rounded text-[10px] font-medium ${selectedAgent.modelBadge}`}>{selectedAgent.model}</span>
                <button
                  onClick={() => { setSelectedAgent(null); setActiveConvId(null) }}
                  className="ml-auto p-0.5 rounded hover:bg-gray-100 transition-colors"
                  title="Remover agente selecionado"
                >
                  <X className="w-3 h-3" style={{ color: '#888888' }} />
                </button>
              </div>
            )}
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={selectedAgent
                ? `Descreva o caso ou faça sua solicitação para ${selectedAgent.name}…`
                : 'Selecione um agente abaixo e descreva o caso ou faça sua solicitação…'}
              className="w-full px-5 pt-4 pb-2 text-sm placeholder-gray-400 resize-none outline-none leading-relaxed"
              style={{ color: '#222222', minHeight: '72px', maxHeight: '180px' }}
              rows={3}
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <button onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg transition-colors" style={{ color: '#888888' }}
                title="Anexar arquivo">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" multiple className="hidden"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.csv,.png,.jpg,.jpeg"
                onChange={e => handleFileUpload(e.target.files)} />
              <button
                onClick={sendMessage}
                disabled={!prompt.trim() || !selectedAgent}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: prompt.trim() && selectedAgent ? '#0f2044' : '#E5E7EB',
                  color:      prompt.trim() && selectedAgent ? '#FFFFFF'  : '#9CA3AF',
                }}
                title="Enviar (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

      {/* ── Área de mensagens — aparece entre o input e o grid quando há conversa ── */}
      {activeConv && activeConv.messages.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mt-4 mb-2 rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E5E7EB', background: '#FAFAFA', maxHeight: '320px', overflowY: 'auto' }}>
          {/* Header da conversa */}
          <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">{selectedAgent?.emoji}</span>
              <span className="text-xs font-bold" style={{ color: '#222222' }}>{selectedAgent?.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => startConversation(selectedAgent!)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 transition-colors" style={{ color: '#444444' }}>
                <Plus className="w-3 h-3" /> Nova
              </button>
              <button onClick={() => setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: [] } : c))}
                className="p-1 rounded-lg hover:bg-red-50 transition-colors" title="Limpar">
                <Trash2 className="w-3.5 h-3.5" style={{ color: '#888888' }} />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="px-4 py-3 space-y-4">
            {activeConv.messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>
                {msg.role === 'assistant' && selectedAgent && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-1"
                    style={{ background: selectedAgent.color + '18' }}>
                    {selectedAgent.emoji}
                  </div>
                )}
                <div className={`max-w-[80%]`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={msg.role === 'user'
                      ? { background: '#0f2044', color: '#FFFFFF' }
                      : { background: '#FFFFFF', border: '1px solid #E5E7EB', color: '#222222' }}
                  >
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                        <span style={{ color: '#888888' }}>Processando...</span>
                      </div>
                    ) : (
                      msg.content.split('\n').map((line, li) =>
                        msg.role === 'user'
                          ? <p key={li} className={line === '' ? 'mb-1' : ''}>{line}</p>
                          : renderLine(line, li)
                      )
                    )}
                  </div>
                  {/* Ações hover */}
                  {msg.role === 'assistant' && !msg.isLoading && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyMessage(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors">
                        {copiedMsgId === msg.id
                          ? <Check className="w-3 h-3 text-green-600" />
                          : <Copy className="w-3 h-3" style={{ color: '#888888' }} />}
                      </button>
                      <button onClick={() => downloadDocument(msg.content, selectedAgent?.name || 'agente')}
                        className="p-1 rounded hover:bg-gray-200 transition-colors">
                        <Download className="w-3 h-3" style={{ color: '#888888' }} />
                      </button>
                      <span className="text-[10px]" style={{ color: '#888888' }}>
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ml-2 mt-1"
                    style={{ background: '#D4A017', color: '#FFFFFF' }}>MM</div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* ── Todos os agentes — grid completo sem corte ── */}
          <p className="text-center text-xs font-semibold mt-8 mb-4 uppercase tracking-wider" style={{ color: '#444444' }}>
            Selecione um agente para começar
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-8">
            {ECOSYSTEM_AGENTS.filter(a => a.active).map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  // Mantém na mesma tela — só seleciona o agente
                  setSelectedAgent(agent)
                  // Cria conversa nova sem navegar para outra tela
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
                }}
                className={`group p-3.5 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-md ${selectedAgent?.id === agent.id ? 'ring-2' : ''}`}
                style={{
                  background: selectedAgent?.id === agent.id ? agent.color + '0D' : '#FFFFFF',
                  border: selectedAgent?.id === agent.id ? `2px solid ${agent.color}` : '1px solid #E5E7EB',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl mb-2"
                  style={{ background: agent.color + '18', border: `1px solid ${agent.color}30` }}>
                  {agent.emoji}
                </div>
                <p className="text-xs font-bold leading-tight mb-0.5" style={{ color: '#222222' }}>{agent.name}</p>
                <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: '#444444' }}>{agent.description}</p>
                <span className={`inline-block mt-1.5 px-1.5 py-0 rounded text-[10px] font-medium ${agent.modelBadge}`}>
                  {agent.model}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // ── CHAT ────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════
  const renderChat = () => {
    if (!selectedAgent || !activeConv) return renderWelcome()
    const messages = activeConv.messages

    return (
      <div className="flex-1 flex flex-col" style={{ background: '#FFFFFF' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* ── Título centralizado no topo do chat ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
          style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>

          {/* Esquerda: agente */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: selectedAgent.color + '18', border: `1px solid ${selectedAgent.color}30` }}>
              {selectedAgent.emoji}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: '#222222' }}>{selectedAgent.name}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0 rounded text-[11px] font-medium ${selectedAgent.modelBadge}`}>{selectedAgent.model}</span>
                <span className="text-[11px]" style={{ color: '#555555' }}>
                  {selectedAgent.project === 'juris' ? '⚖️ Juris' : selectedAgent.project === 'growth' ? '📈 Growth' : '🌐'}
                </span>
              </div>
            </div>
          </div>

          {/* Centro: título workspace */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <Sparkles className="w-4 h-4" style={{ color: '#D4A017' }} />
            <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#222222' }}>Ben Ecosystem IA — Workspace</span>
          </div>

          {/* Direita: ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {['dr-ben-pesquisa','dr-ben-fiscal','dr-ben-previdenciario','dr-ben-trabalhista','dr-ben-analise-processo'].includes(selectedAgent.id) && (
              <button onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${useSearch ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Globe className="w-3 h-3" /> Pesquisa
              </button>
            )}
            {['dr-ben-peticoes','dr-ben-contratos','dr-ben-procuracoes','dr-ben-producao','dr-ben-compliance'].includes(selectedAgent.id) && (
              <button onClick={() => setLetterheadMode(!letterheadMode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${letterheadMode ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <ScrollText className="w-3 h-3" /> Timbre
              </button>
            )}
            <button onClick={() => startConversation(selectedAgent)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <Plus className="w-3 h-3" /> Nova
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, messages: [] } : c))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Limpar">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Mensagens ── */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Drag overlay */}
          {dragOver && (
            <div className="absolute inset-0 z-50 flex items-center justify-center"
              style={{ background: 'rgba(212,160,23,0.1)', border: '2px dashed #D4A017' }}>
              <div className="text-center">
                <Paperclip className="w-10 h-10 mx-auto mb-2" style={{ color: '#D4A017' }} />
                <p className="font-semibold text-gray-700">Solte os arquivos aqui</p>
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style={{ background: selectedAgent.color + '18', border: `1px solid ${selectedAgent.color}30` }}>
                {selectedAgent.emoji}
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#222222' }}>{selectedAgent.name}</h3>
              <p className="text-sm max-w-md leading-relaxed mb-2" style={{ color: '#444444' }}>{selectedAgent.description}</p>
              <p className="text-xs max-w-sm leading-relaxed" style={{ color: '#555555' }}>
                Descreva o caso ou faça sua solicitação. O agente responde livremente com base no que você informar.
              </p>
            </div>
          )}

          {/* Lista de mensagens */}
          <div className="px-6 py-5 space-y-5 max-w-4xl mx-auto w-full">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group`}>

                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mr-3 mt-1"
                    style={{ background: selectedAgent.color + '18', border: `1px solid ${selectedAgent.color}30` }}>
                    {selectedAgent.emoji}
                  </div>
                )}

                <div className={`max-w-[78%] ${msg.role === 'user' ? 'ml-10' : 'mr-4'}`}>
                  {msg.role === 'assistant' && msg.agentName && (
                    <p className="text-xs font-semibold mb-1 ml-1" style={{ color: '#444444' }}>{msg.agentName}</p>
                  )}

                  <div
                    className={`relative rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={msg.role === 'user'
                      ? { background: '#0f2044' }
                      : { background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }
                    }
                  >
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-sm text-gray-500">Processando...</span>
                        {[0,150,300].map(d => (
                          <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed" style={{ color: msg.role === 'user' ? '#FFFFFF' : '#222222' }}>
                        {msg.content.split('\n').map((line, li) =>
                          msg.role === 'user'
                            ? <p key={li} className={line === '' ? 'mb-2' : 'mb-0.5'}>{line}</p>
                            : renderLine(line, li)
                        )}
                      </div>
                    )}

                    {/* Anexos do usuário */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap gap-1">
                        {msg.attachments.map(att => (
                          <div key={att.id} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/20 text-white/90">
                            {att.type === 'text/url' ? <Link2 className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            <span className="max-w-[140px] truncate">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações hover */}
                  {msg.role === 'assistant' && !msg.isLoading && (
                    <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyMessage(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors" title="Copiar">
                        {copiedMsgId === msg.id
                          ? <Check className="w-3.5 h-3.5 text-green-600" />
                          : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                      </button>
                      <button onClick={() => downloadDocument(msg.content, selectedAgent.name)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors" title="Baixar .txt">
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <span className="text-[11px] ml-1" style={{ color: '#555555' }}>
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ml-3 mt-1"
                    style={{ background: '#D4A017', color: '#FFFFFF' }}>
                    MM
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ── INPUT AREA ────────────────────────────────────────
            ═══════════════════════════════════════════════════ */}
        <div className="border-t flex-shrink-0 px-6 py-4" style={{ background: '#FFFFFF', borderColor: '#E5E7EB' }}>

          {/* Preview de anexos */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                  {att.type === 'text/url'          ? <Link2 className="w-3 h-3 text-purple-500" />
                    : att.type.startsWith('image/') ? <ImageIcon className="w-3 h-3 text-blue-500" />
                    : att.type.startsWith('audio/') ? <Mic className="w-3 h-3 text-pink-500" />
                    :                                 <FileText className="w-3 h-3 text-gray-500" />}
                  <span className="max-w-[150px] truncate font-medium" style={{ color: '#222222' }}>{att.name}</span>
                  {att.size > 0 && <span style={{ color: '#666666' }}>({(att.size/1024).toFixed(0)}KB)</span>}
                  <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Campo de entrada centralizado */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 rounded-2xl px-4 py-3"
              style={{ background: '#FAFAFA', border: '1.5px solid #D1D5DB' }}>

              {/* ── Botão CLIP com menu expandido ── */}
              <div className="relative flex-shrink-0" ref={attachMenuRef}>
                <button
                  onClick={() => { setAttachMenuOpen(!attachMenuOpen); setShowUrlInput(false) }}
                  className={`p-1.5 rounded-lg transition-colors ${attachMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'}`}
                  title="Anexar — arquivos, e-mail, drive, URL…"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Menu expandido do clip */}
                {attachMenuOpen && (
                  <div className="absolute bottom-10 left-0 z-50 w-64 rounded-2xl shadow-xl overflow-hidden"
                    style={{ background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                    <div className="px-4 py-2.5 border-b" style={{ borderColor: '#F3F4F6' }}>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#222222' }}>Anexar</p>
                    </div>

                    {showUrlInput ? (
                      <div className="p-3">
                        <p className="text-xs mb-2" style={{ color: '#444444' }}>Cole a URL do documento ou página:</p>
                        <input
                          autoFocus
                          value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                          placeholder="https://…"
                          className="w-full px-3 py-2 text-xs rounded-lg outline-none"
                          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleAddUrl}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                            style={{ background: '#0f2044' }}>
                            Adicionar
                          </button>
                          <button onClick={() => setShowUrlInput(false)}
                            className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-1">
                        {ATTACH_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => handleAttachOption(opt.id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.bg} ${opt.color}`}>
                              {opt.icon}
                            </div>
                            <div>
                              <p className="text-xs font-semibold" style={{ color: '#222222' }}>{opt.label}</p>
                              <p className="text-[11px]" style={{ color: '#555555' }}>{opt.sub}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Inputs ocultos */}
                <input ref={fileInputRef} type="file" multiple className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.xlsx,.csv,.odt,.rtf,.eml"
                  onChange={e => handleFileUpload(e.target.files)} />
                <input ref={imageInputRef} type="file" multiple className="hidden"
                  accept="image/*"
                  onChange={e => handleFileUpload(e.target.files)} />
                <input ref={audioInputRef} type="file" multiple className="hidden"
                  accept="audio/*"
                  onChange={e => handleFileUpload(e.target.files)} />
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={`Descreva o caso ou faça sua solicitação para ${selectedAgent.name}…`}
                className="flex-1 bg-transparent text-sm placeholder-gray-400 resize-none outline-none leading-relaxed"
                style={{ color: '#222222', minHeight: '24px', maxHeight: '200px' }}
                rows={1}
                disabled={isLoading}
              />

              {/* Enviar */}
              <button
                onClick={sendMessage}
                disabled={!prompt.trim() || isLoading}
                className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: (!prompt.trim() || isLoading) ? '#E5E7EB' : '#0f2044',
                  color:      (!prompt.trim() || isLoading) ? '#9CA3AF' : '#FFFFFF',
                }}
                title="Enviar (Enter)"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {letterheadMode && (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <ScrollText className="w-3 h-3" /> Timbre ativo
                  </span>
                )}
                {useSearch && (
                  <span className="flex items-center gap-1 text-purple-600 font-medium">
                    <Globe className="w-3 h-3" /> Pesquisa ao vivo
                  </span>
                )}
                {attachments.length > 0 && (
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Paperclip className="w-3 h-3" /> {attachments.length} anexo(s)
                  </span>
                )}
              </div>
              <span className="text-[11px]" style={{ color: '#888888' }}>Enter ↵ enviar · Shift+Enter nova linha</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Render Principal ─────────────────────────────────────────
  return (
    <div className="flex rounded-2xl overflow-hidden shadow-xl"
      style={{ height: 'calc(100vh - 5rem)', border: '1px solid #E5E7EB', background: '#FFFFFF' }}>
      {renderSidebar()}
      {/* Sempre renderiza Welcome — o chat aparece integrado dentro dela */}
      {renderWelcome()}
    </div>
  )
}
