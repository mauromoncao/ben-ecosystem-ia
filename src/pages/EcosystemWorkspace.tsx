import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { downloadDocx } from '../lib/generateDocx'
// timbreFile salvo na sessão para não precisar reanexa a cada download
let _sessionTimbreFile: File | null = null
import {
  Send, FileText, X, Loader2, Plus, Trash2,
  Search, Copy, Check, Download,
  Maximize2, Minimize2,
  Globe, Paperclip,
  Clock, PanelRight, PanelRightClose,
  TrendingUp, Scale, BarChart3, Cpu, FlaskConical, Users,
  Mail, FolderOpen, FileImage, Stamp, ChevronLeft,
  BookOpen, Mic, Sparkles,
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
interface AttachmentItem {
  name: string; text: string; type: string
  namespace?: string   // Pinecone namespace quando indexado via VPS
  pages?: number       // Nº de páginas do documento
  chars?: number       // Tamanho do texto extraído
  rag_ready?: boolean  // Se foi indexado no Pinecone para RAG
  parsing?: boolean    // Estado de carregamento do parser
}

// ─── Agentes ──────────────────────────────────────────────────
const AGENTS: Agent[] = [
  // ── Jurídico ─────────────────────────────────────────────────
  { id: 'ben-agente-operacional-maximus',  shortName: 'Agente Maximus',        name: 'AGENTE OPERACIONAL MAXIMUS',          emoji: '⭐', description: 'Análise jurídica de máxima profundidade — última instância, análise final e vinculante.', model: 'Claude Opus 4',    category: 'juridico',    project: 'juris',  color: '#92400e', accentColor: '#fef3c7', premium: true },
  { id: 'ben-agente-operacional-premium',  shortName: 'Agente Premium',        name: 'AGENTE OPERACIONAL PREMIUM',          emoji: '🔷', description: 'Análise jurídica moderada a profunda. Thinking adaptativo automático. Sinaliza casos para o Maximus.', model: 'Claude Sonnet 4',  category: 'juridico', project: 'juris', color: '#1d4ed8', accentColor: '#dbeafe', premium: true },
  { id: 'ben-agente-operacional-standard', shortName: 'Agente Standard',       name: 'AGENTE OPERACIONAL STANDARD',         emoji: '🟢', description: 'Execução operacional rápida. Extração, resumo, classificação, checklist. Thinking OFF.', model: 'Claude Haiku 4',   category: 'juridico',    project: 'juris',  color: '#16a34a', accentColor: '#dcfce7', premium: false },
  { id: 'ben-tributarista-estrategista',   shortName: 'Tributarista Estrat.',  name: 'AGENTE TRIBUTARISTA ESTRATEGISTA',    emoji: '🔱', description: 'Especialista em Direito Tributário Puro. Thinking sempre ativo. Raciocínio em 7 camadas. Defesa no CARF, TJ, STJ e STF.', model: 'Claude Opus 4', category: 'juridico', project: 'juris', color: '#b45309', accentColor: '#fef3c7', premium: true },
  { id: 'ben-processualista-estrategico',  shortName: 'Processualista Estrat.',name: 'AGENTE PROCESSUALISTA ESTRATÉGICO',   emoji: '📋', description: 'Estrategista processual de nível STF/STJ. Thinking sempre ativo. Análise em 6 camadas. Pipeline RAG para PDFs.', model: 'Claude Opus 4', category: 'juridico', project: 'juris', color: '#1e3a5f', accentColor: '#dbeafe', premium: true },
  { id: 'ben-pesquisador-juridico',        shortName: 'Pesquisador',           name: 'BEN Pesquisador Jurídico',            emoji: '🔎', description: 'Pesquisa em tempo real: STF, STJ, TRF, TJPI com citações.',       model: 'Perplexity',       category: 'juridico',    project: 'juris',  color: '#6d28d9', accentColor: '#ede9fe' },
  // ── Contador ─────────────────────────────────────────────────
  { id: 'ben-contador-tributarista',              shortName: 'Triagem',              name: 'BEN Contador — Triagem',              emoji: '🧮', description: 'Triagem fiscal.',                          model: 'Claude Haiku 4',   category: 'contador', project: 'juris', color: '#92400e', accentColor: '#fef3c7' },
  { id: 'ben-contador-especialista',              shortName: 'Especialista',         name: 'BEN Contador — Especialista',         emoji: '📊', description: 'Análise fiscal profunda.',                  model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#b45309', accentColor: '#fef9c3' },
  { id: 'ben-contador-planejamento',              shortName: 'Planejamento',         name: 'BEN Contador — Planejamento',         emoji: '🗺️', description: 'Planejamento tributário estratégico.',      model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#d97706', accentColor: '#fef3c7' },
  { id: 'ben-contador-creditos',                  shortName: 'Créditos',             name: 'BEN Contador — Créditos',             emoji: '💳', description: 'Recuperação de créditos tributários.',      model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-contador-auditoria',                 shortName: 'Auditoria',            name: 'BEN Contador — Auditoria',            emoji: '🔍', description: 'Auditoria fiscal.',                         model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#dc2626', accentColor: '#fee2e2' },
  { id: 'ben-contador-relatorio',                 shortName: 'Relatório',            name: 'BEN Contador — Relatório',            emoji: '📋', description: 'Relatórios fiscais.',                       model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#0369a1', accentColor: '#e0f2fe' },
  { id: 'ben-contador-tributarista-planejamento', shortName: 'Trib. Planejamento',   name: 'BEN Contador Trib. — Planejamento',   emoji: '🗂️', description: 'Planejamento tributário nível 2.',          model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#d97706', accentColor: '#fef3c7' },
  { id: 'ben-contador-tributarista-creditos',     shortName: 'Trib. Créditos',       name: 'BEN Contador Trib. — Créditos',       emoji: '💰', description: 'Créditos tributários nível 2.',             model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-contador-tributarista-auditoria',    shortName: 'Trib. Auditoria',      name: 'BEN Contador Trib. — Auditoria',      emoji: '🔎', description: 'Auditoria tributária nível 2.',             model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#dc2626', accentColor: '#fee2e2' },
  { id: 'ben-contador-tributarista-relatorio',    shortName: 'Trib. Relatório',      name: 'BEN Contador Trib. — Relatório',      emoji: '📑', description: 'Relatório tributário nível 2.',             model: 'Claude Sonnet 4',  category: 'contador', project: 'juris', color: '#0369a1', accentColor: '#e0f2fe' },
  // ── Perito Forense ───────────────────────────────────────────
  { id: 'ben-perito-forense',          shortName: 'Padrão',        name: 'BEN Perito Forense — Padrão',     emoji: '🔬', description: 'Laudos periciais.',              model: 'Claude Sonnet 4',  category: 'perito', project: 'juris', color: '#4f46e5', accentColor: '#e0e7ff' },
  { id: 'ben-perito-forense-profundo', shortName: 'Profundo',      name: 'BEN Perito Forense — Profundo',   emoji: '🧬', description: 'Análise pericial profunda.',     model: 'Claude Opus 4',    category: 'perito', project: 'juris', color: '#b91c1c', accentColor: '#fee2e2', premium: true },
  { id: 'ben-perito-forense-digital',  shortName: 'Digital',       name: 'BEN Perito Forense Digital',      emoji: '💻', description: 'Perícia digital.',              model: 'Claude Sonnet 4',  category: 'perito', project: 'juris', color: '#7c3aed', accentColor: '#ede9fe' },
  { id: 'ben-perito-forense-laudo',    shortName: 'Laudo',         name: 'BEN Perito Forense — Laudo',      emoji: '📄', description: 'Laudos técnicos.',              model: 'Claude Sonnet 4',  category: 'perito', project: 'juris', color: '#0369a1', accentColor: '#e0f2fe' },
  { id: 'ben-perito-forense-contestar',shortName: 'Contraditório', name: 'BEN Perito — Contraditório',      emoji: '🛡️', description: 'Contestação de laudos.',        model: 'Claude Sonnet 4',  category: 'perito', project: 'juris', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-perito-forense-relatorio',shortName: 'Relatório',     name: 'BEN Perito Forense — Relatório',  emoji: '📊', description: 'Relatórios periciais.',         model: 'Claude Sonnet 4',  category: 'perito', project: 'juris', color: '#374151', accentColor: '#f3f4f6' },
  { id: 'ben-perito-imobiliario',      shortName: 'Imobiliário',   name: 'BEN Perito Imobiliário — ABNT',   emoji: '🏠', description: 'Perícia imobiliária ABNT.',     model: 'Claude Sonnet 4',  category: 'perito', project: 'juris', color: '#78350f', accentColor: '#fef3c7' },
  // ── Growth & Marketing ───────────────────────────────────────
  { id: 'ben-atendente',              shortName: 'Atendente',     name: 'BEN Atendente',                    emoji: '🤝', description: 'Atendimento jurídico 24/7.',        model: 'GPT-4o Mini',      category: 'atendimento', project: 'growth', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-conteudista',            shortName: 'Conteudista',   name: 'BEN Conteudista Jurídico',         emoji: '✍️', description: 'Artigos e conteúdo OAB.',           model: 'GPT-4o',           category: 'marketing',   project: 'growth', color: '#7c3aed', accentColor: '#ede9fe' },
  { id: 'ben-estrategista-campanhas', shortName: 'Campanhas',     name: 'BEN Estrategista Campanhas',       emoji: '📊', description: 'Meta Ads e Google Ads.',            model: 'GPT-4o',           category: 'marketing',   project: 'growth', color: '#059669', accentColor: '#d1fae5' },
  { id: 'ben-estrategista-marketing', shortName: 'Marketing',     name: 'BEN Estrategista Marketing',       emoji: '📣', description: 'Redes sociais e branding.',         model: 'GPT-4o',           category: 'marketing',   project: 'growth', color: '#0369a1', accentColor: '#e0f2fe' },
  { id: 'ben-analista-relatorios',    shortName: 'Relatórios',    name: 'BEN Analista de Relatórios',       emoji: '📈', description: 'Relatórios de performance.',        model: 'Claude Haiku 4.5', category: 'marketing',   project: 'growth', color: '#d97706', accentColor: '#fef3c7' },
  { id: 'ben-diretor-criativo',       shortName: 'Dir. Criativo', name: 'BEN Diretor Criativo',             emoji: '🎨', description: 'Branding jurídico.',                model: 'GPT-4o',           category: 'marketing',   project: 'growth', color: '#7c3aed', accentColor: '#ede9fe' },
  // ── Sistema ──────────────────────────────────────────────────
  { id: 'ben-assistente-geral',       shortName: 'BEN Copilot',      name: 'BEN Copilot — Universal',        emoji: '🤖', description: 'Copiloto universal BEN IA — sem restrições temáticas.',    model: 'GPT-4o',           category: 'sistema',     project: 'juris',  color: '#6d28d9', accentColor: '#ede9fe' },
  { id: 'ben-engenheiro-prompt',      shortName: 'Eng. Prompt',      name: 'BEN Engenheiro de Prompt',       emoji: '🧠', description: 'Otimização de prompts e arquitetura de agentes IA.',        model: 'GPT-4o',           category: 'sistema',     project: 'juris',  color: '#4f46e5', accentColor: '#e0e7ff' },
  { id: 'ben-analista-monitoramento', shortName: 'Monitoramento',    name: 'BEN Analista Monitoramento',     emoji: '🔍', description: 'Saúde do sistema e monitoramento de métricas.',            model: 'Claude Haiku 4.5', category: 'sistema',     project: 'juris',  color: '#dc2626', accentColor: '#fee2e2' },
  { id: 'ben-monitor-juridico',       shortName: 'Monitor Jurídico', name: 'BEN Monitor Jurídico DJe + CNJ', emoji: '📡', description: 'Monitoramento de publicações DJe e CNJ em tempo real.',   model: 'Claude Sonnet 4',  category: 'sistema',     project: 'juris',  color: '#0e7490', accentColor: '#cffafe' },
  { id: 'ben-assistente-cnj',         shortName: 'Assistente CNJ',   name: 'BEN Assistente CNJ DataJud',     emoji: '🔱', description: 'Consultas ao DataJud e CNJ com análise de movimentações.', model: 'Claude Sonnet 4',  category: 'sistema',     project: 'juris',  color: '#0e7490', accentColor: '#cffafe' },
  { id: 'ben-assistente-voz',         shortName: 'Assistente Voz',   name: 'BEN Assistente Voz — TTS',       emoji: '🎙️', description: 'Converte textos dos agentes em áudio via ElevenLabs.',     model: 'Claude Haiku 4',   category: 'sistema',     project: 'juris',  color: '#7c3aed', accentColor: '#ede9fe' },
]

const DEFAULT_AGENT_ID = 'ben-assistente-geral'
const COPILOT_AGENT_ID  = 'ben-assistente-geral'

const CATEGORY_LABEL: Record<string, string> = {
  juridico: 'Jurídico', contador: 'Contador', perito: 'Perito',
  marketing: 'Growth', atendimento: 'Atendimento', sistema: 'Sistema',
}
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  juridico: <Scale className="w-3 h-3" />, contador: <BarChart3 className="w-3 h-3" />,
  perito: <FlaskConical className="w-3 h-3" />, marketing: <TrendingUp className="w-3 h-3" />,
  atendimento: <Users className="w-3 h-3" />, sistema: <Cpu className="w-3 h-3" />,
}

// ─── Storage ──────────────────────────────────────────────────
const STORAGE_KEY = 'ben_eco_convs_v3'
function loadConvs(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveConvs(c: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c.slice(0, 60))) } catch {}
}

function shouldOpenArtifact(content: string): boolean {
  return content.length > 800 ||
    /petição|contrato|recurso|mandado|habeas|laudo|parecer|relatório|minuta|procuração|artigo|ementa|timbrado/i.test(content)
}

function fmtTime(ms?: number) {
  if (!ms) return ''
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

// ─── Markdown ─────────────────────────────────────────────────
function MarkdownContent({ content, dark = false }: { content: string; dark?: boolean }) {
  const base = dark ? '#E2E8F0' : '#1A1A1A'
  const muted = dark ? '#94A3B8' : '#6B7280'
  const codeBg = dark ? 'rgba(255,255,255,0.08)' : '#F3F4F6'
  const codeColor = dark ? '#F1C40F' : '#1d4ed8'
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'
  return (
    <div className="markdown-body text-sm leading-relaxed" style={{ color: base }}>
      <ReactMarkdown components={{
        h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 pb-1 border-b" style={{ color: base, borderColor }}>{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5" style={{ color: base }}>{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: base }}>{children}</h3>,
        p: ({ children }) => <p className="mb-2.5 last:mb-0" style={{ lineHeight: '1.75', color: base }}>{children}</p>,
        ul: ({ children }) => <ul className="mb-2.5 pl-4 space-y-1" style={{ listStyleType: 'disc', color: base }}>{children}</ul>,
        ol: ({ children }) => <ol className="mb-2.5 pl-4 space-y-1" style={{ listStyleType: 'decimal', color: base }}>{children}</ol>,
        li: ({ children }) => <li style={{ color: base }}>{children}</li>,
        strong: ({ children }) => <strong className="font-bold" style={{ color: base }}>{children}</strong>,
        em: ({ children }) => <em className="italic" style={{ color: muted }}>{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 pl-4 py-1 my-2 italic rounded-r"
            style={{ borderColor: '#D4A017', background: dark ? 'rgba(212,160,23,0.1)' : '#FFFBF0', color: muted }}>
            {children}
          </blockquote>
        ),
        code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
          inline
            ? <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: codeBg, color: codeColor }}>{children}</code>
            : <pre className="p-4 rounded-xl overflow-x-auto my-3 text-xs font-mono" style={{ background: codeBg, color: codeColor }}><code>{children}</code></pre>,
        hr: () => <hr className="my-4 border-t" style={{ borderColor }} />,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: dark ? '#93C5FD' : '#1d4ed8' }}>{children}</a>,
        table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-xs border-collapse" style={{ borderColor }}>{children}</table></div>,
        thead: ({ children }) => <thead style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#F9FAFB' }}>{children}</thead>,
        th: ({ children }) => <th className="px-3 py-2 text-left font-semibold border" style={{ borderColor, color: base }}>{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 border" style={{ borderColor, color: base }}>{children}</td>,
      }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Model Badge ──────────────────────────────────────────────
function ModelBadge({ model }: { model: string }) {
  const s =
    /opus/i.test(model)       ? { bg: '#fef3c7', color: '#92400e' } :
    /sonnet/i.test(model)     ? { bg: '#fce7f3', color: '#9d174d' } :
    /gpt-4o/i.test(model) && !/mini/i.test(model) ? { bg: '#dbeafe', color: '#1e40af' } :
    /mini/i.test(model)       ? { bg: '#e0f2fe', color: '#0369a1' } :
    /perplexity/i.test(model) ? { bg: '#ede9fe', color: '#5b21b6' } :
                                { bg: '#f3f4f6', color: '#374151' }
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: s.bg, color: s.color }}>
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

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(() =>
    AGENTS.find(a => a.id === DEFAULT_AGENT_ID) || AGENTS[0] || null
  )
  // Rastreia o agente anterior para retorno ao BEN Copilot
  const prevAgentIdRef = useRef<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>(loadConvs)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [useSearch, setUseSearch] = useState(false)
  const [attachment, setAttachment] = useState<AttachmentItem | null>(null)

  const [showHistory, setShowHistory] = useState(true)
  const [histSearch, setHistSearch] = useState('')

  const [artifactOpen, setArtifactOpen] = useState(false)
  const [artifactContent, setArtifactContent] = useState('')
  const [artifactTitle, setArtifactTitle] = useState('')
  const [artifactCopied, setArtifactCopied] = useState(false)
  const [artifactFull, setArtifactFull] = useState(false)

  // Modal de timbre: null = fechado, 'pending' = aguardando escolha
  type TimbreChoice = 'com' | 'sem' | 'cancel'
  const [timbreModal, setTimbreModal] = useState<null | 'pending'>(null)
  const [timbreResolve, setTimbreResolve] = useState<null | ((v: TimbreChoice) => void)>(null)
  const [savedTimbreFile, setSavedTimbreFile] = useState<File | null>(_sessionTimbreFile)
  const timbreFileRef = useRef<HTMLInputElement>(null)

  // Toolbar de anexos expandida
  const [showAttachMenu, setShowAttachMenu] = useState(false)

  // Input focused state for border highlight
  const [inputFocused, setInputFocused] = useState(false)

  // Model override: null = default, 'opus' = Claude Opus, 'sonnet' = Claude Sonnet
  const [modelOverride, setModelOverride] = useState<'opus' | 'sonnet' | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)

  // ── Init: abre BEN Copilot ao carregar ──────────────────
  useEffect(() => {
    const copilot = AGENTS.find(a => a.id === COPILOT_AGENT_ID) || AGENTS[0]
    if (copilot) {
      openAgent(copilot)
      // Notifica o Layout para que o sidebar destaque o BEN Copilot
      onAgentOpened?.(copilot.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reage ao agente selecionado via sidebar ───────────────
  useEffect(() => {
    if (!pendingAgentId) return
    const agent = AGENTS.find(a => a.id === pendingAgentId)
    if (agent) {
      // Registra agente anterior antes de trocar
      if (selectedAgent && selectedAgent.id !== pendingAgentId) {
        prevAgentIdRef.current = selectedAgent.id
      }
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px'
    }
  }, [input])

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    setAttachment(null)
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
    if (attachment?.parsing) return // aguarda parser terminar

    // Nota do anexo mostrada no histórico de mensagens do usuário
    const attachNote = attachment
      ? `\n\n📎 **${attachment.name}** (${attachment.type})${attachment.pages ? ` — ${attachment.pages} pág.` : ''}${attachment.rag_ready ? ' ✅ RAG' : ''}`
      : ''

    // Contexto do documento para o backend: usa preview_text (primeiros 8k chars)
    // + pdfNamespace para RAG via Pinecone quando disponível
    const attachContext = attachment
      ? `\n\nDocumento anexado: **${attachment.name}**\n${attachment.namespace ? `[RAG habilitado — namespace: ${attachment.namespace}]\n` : ''}${attachment.text.slice(0, 8000)}`
      : ''

    // Problema 4: se o painel de artefato estiver aberto, injetar o
    // conteúdo gerado anteriormente no contexto para o agente poder revisar
    const artifactContext = artifactOpen && artifactContent
      ? `\n\n[CONTEXTO — TEXTO QUE VOCÊ GEROU ANTERIORMENTE — REVISE/AJUSTE CONFORME SOLICITADO]\n${artifactContent}\n[/CONTEXTO]\n\nInstrução de revisão/ajuste: `
      : ''

    const userMsg: Message = {
      id: `u-${Date.now()}`, role: 'user',
      content: msg + attachNote + (artifactContext ? '\n📎 Contexto do artefato ativo' : ''),
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
          input: artifactContext + msg + attachContext,
          useSearch,
          modelOverride: modelOverride ?? undefined,
          // Passa namespace Pinecone para RAG no backend
          pdfNamespace: attachment?.namespace || undefined,
          context: { source: 'ecosystem-workspace-v4' },
        }),
        signal: AbortSignal.timeout(115000),
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
        content: '❌ Erro de conexão. Verifique a API e tente novamente.',
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

  const copyArtifact = () => {
    navigator.clipboard.writeText(artifactContent)
    setArtifactCopied(true)
    setTimeout(() => setArtifactCopied(false), 2000)
  }

  // Pergunta ao usuário: com timbre / sem timbre / cancelar
  type TimbreChoice = 'com' | 'sem' | 'cancel'
  const askTimbre = (): Promise<TimbreChoice> =>
    new Promise(resolve => {
      setTimbreModal('pending')
      setTimbreResolve(() => resolve)
    })

  const handleTimbreChoice = (choice: TimbreChoice) => {
    setTimbreModal(null)
    timbreResolve?.(choice)
    setTimbreResolve(null)
  }

  // Upload do .docx do timbre pelo usuário
  const handleTimbreFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    _sessionTimbreFile = file
    setSavedTimbreFile(file)
    e.target.value = ''
    // Após selecionar, confirmar automaticamente com timbre
    handleTimbreChoice('com')
  }

  const downloadArtifact = async (format: 'docx' | 'txt' = 'docx') => {
    const filename = `${artifactTitle.replace(/[^a-z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ ]/gi, '_').trim()}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
    if (format === 'txt') {
      const blob = new Blob([artifactContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${filename}.txt`
      a.click(); URL.revokeObjectURL(url)
      return
    }
    // Pergunta sobre timbre
    const choice = await askTimbre()
    if (choice === 'cancel') return
    try {
      const timbreFile = choice === 'com' ? (savedTimbreFile || _sessionTimbreFile) : null
      await downloadDocx(artifactContent, artifactTitle, selectedAgent?.shortName || 'BEN Agente', timbreFile)
    } catch (err) {
      console.error('Docx error:', err)
      const blob = new Blob([artifactContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `${filename}.txt`
      a.click(); URL.revokeObjectURL(url)
    }
  }

  // ── Upload arquivo — VPS Parser (PDF/DOCX/XLSX/IMG) ───────────
  const VPS_PARSER = 'http://181.215.135.202:3010'
  const PARSER_TOKEN = 'ben-parser-2026'

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, type = 'documento') => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setShowAttachMenu(false)

    // Mostra estado de "processando"
    setAttachment({ name: file.name, text: '⏳ Processando documento...', type, parsing: true })

    try {
      // Lê arquivo como base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = (ev) => resolve((ev.target?.result as string).split(',')[1] || '')
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Tenta primeiro via endpoint Vercel /api/upload (HTTPS seguro)
      // Se falhar (VPS offline), tenta diretamente no VPS
      let data: Record<string, unknown> | null = null

      try {
        const resp = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            filename: file.name,
            mimetype: file.type || '',
            index_rag: true,
            agent_id: selectedAgent?.id || 'ecosystem',
          }),
          signal: AbortSignal.timeout(120000),
        })
        if (resp.ok) {
          data = await resp.json()
        }
      } catch {
        // Fallback direto para VPS (pode falhar em HTTPS por Mixed Content)
        try {
          const resp2 = await fetch(`${VPS_PARSER}/extract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-parser-token': PARSER_TOKEN,
            },
            body: JSON.stringify({
              base64,
              filename: file.name,
              mimetype: file.type || '',
              index_rag: true,
              agent_id: selectedAgent?.id || 'ecosystem',
            }),
            signal: AbortSignal.timeout(120000),
          })
          if (resp2.ok) data = await resp2.json()
        } catch { /* ambos falharam */ }
      }

      if (data?.success) {
        const pages    = (data.pages    as number) || 0
        const chars    = (data.chars    as number) || 0
        const chunks   = (data.chunks   as number) || 0
        const ragReady = (data.rag_ready as boolean) || false
        const ns       = (data.namespace as string) || ''
        const preview  = (data.preview_text as string) || (data.full_text as string) || ''

        setAttachment({
          name:      file.name,
          text:      preview,
          type,
          namespace: ns,
          pages,
          chars,
          rag_ready: ragReady,
          parsing:   false,
        })
        return
      }

      // Se chegou aqui, o parser retornou mas sem sucesso — usa fallback
      throw new Error(data ? String(data.error || 'Parser retornou falha') : 'Parser indisponível')

    } catch (err: unknown) {
      // Fallback: extração de texto básica via FileReader (funciona para TXT/CSV)
      console.warn('[handleFile] VPS parser indisponível, usando fallback:', (err as Error).message)
      try {
        const textContent = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (ev) => {
            const result = ev.target?.result as string
            resolve(result || '')
          }
          reader.onerror = () => resolve('')
          if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
            reader.readAsText(file, 'utf-8')
          } else {
            reader.readAsBinaryString(file)
          }
        })
        const cleanText = file.type.startsWith('text/')
          ? textContent.slice(0, 20000)
          : (textContent.match(/[\x20-\x7E\n]{4,}/g) || []).join('\n').slice(0, 12000)

        setAttachment({
          name:    file.name,
          text:    cleanText || `[${file.name} — ${(file.size/1024).toFixed(0)}KB — parser VPS offline, envie via texto]`,
          type,
          parsing: false,
        })
      } catch {
        setAttachment({
          name:    file.name,
          text:    `[${file.name} — ${(file.size/1024).toFixed(0)}KB — falha na leitura]`,
          type,
          parsing: false,
        })
      }
    }
  }

  // ── Inserir timbrado padrão ────────────────────────────────
  const insertTimbrado = () => {
    const timbrado = `
---
**MONÇÃO ADVOGADOS ASSOCIADOS**
Dr. Mauro Monção — OAB/PI [Nº]
Endereço: [Endereço completo]
Tel: [Telefone] | E-mail: contato@mauromoncao.adv.br
---

`
    setInput(prev => timbrado + prev)
    setShowAttachMenu(false)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // ── Abrir Gmail (nova janela) ──────────────────────────────
  const openGmail = () => {
    window.open('https://mail.google.com/mail/u/0/#compose', '_blank')
    setShowAttachMenu(false)
  }
  const openDrive = () => {
    window.open('https://drive.google.com', '_blank')
    setShowAttachMenu(false)
  }
  const openDocs = () => {
    window.open('https://docs.google.com/document/create', '_blank')
    setShowAttachMenu(false)
  }

  // ── Histórico filtrado ─────────────────────────────────────
  const filteredHistory = conversations
    .filter(c => c.messages.filter(m => !m.isLoading).length > 0)
    .filter(c => !histSearch || c.title.toLowerCase().includes(histSearch.toLowerCase()))
    .slice(0, 40)

  const messages = activeConv?.messages || []

  // ── Sugestões de abertura ──────────────────────────────────
  const SUGGESTIONS: Record<string, string[]> = {
    'ben-agente-operacional-standard':    ['Extrair dados-chave do documento', 'Resumir peça processual em 3 pontos', 'Classificar demanda por área do direito'],
    'ben-pesquisador-juridico':           ['Jurisprudência do STJ sobre dano moral', 'Teses do STF sobre bis in idem tributário', 'Decisões recentes do TJPI sobre rescisão contratual'],
    'ben-tributarista-estrategista':       ['Impugnação ao auto de infração por IRPJ', 'Estratégia multi-instância CARF → STJ', 'Nulidade de autuação fiscal por vício de intimação'],
    'ben-processualista-estrategico':      ['Mapear nulidades processuais do processo em anexo', 'Elaborar habeas corpus por prisão preventiva sem fundamentação', 'Recurso de apelação com error in judicando'],
    'default':                        ['Faça uma pergunta em linguagem natural', 'Solicite uma peça processual com os dados do caso', 'Envie um documento para análise'],
  }
  const suggestions = SUGGESTIONS[selectedAgent?.id || ''] || SUGGESTIONS['default']

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#F2F4F8' }}>

      {/* ══════════════════════════════════════════════════════
          SIDEBAR DE HISTÓRICO (esquerda, colapsável)
      ══════════════════════════════════════════════════════ */}
      {showHistory && (
        <div className="w-56 flex-shrink-0 flex flex-col border-r shadow-sm"
          style={{ background: '#FFFFFF', borderColor: '#E8ECF0' }}>

          {/* Agente ativo */}
          <div className="p-3 border-b" style={{ borderColor: '#F0F2F5' }}>
            {selectedAgent && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2"
                style={{ background: selectedAgent.accentColor, border: `1px solid ${selectedAgent.color}22` }}>
                <span className="text-xl flex-shrink-0">{selectedAgent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-tight" style={{ color: selectedAgent.color }}>
                    {selectedAgent.name}
                  </p>
                  <p className="text-xs truncate leading-tight mt-0.5" style={{ color: '#6B7280' }}>
                    {selectedAgent.model}
                  </p>
                </div>
              </div>
            )}
            {/* Busca */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
              <input value={histSearch} onChange={e => setHistSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none"
                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#222' }} />
            </div>
            {/* Nova conversa */}
            <button onClick={() => selectedAgent && openAgent(selectedAgent)}
              className="w-full flex items-center gap-2 justify-center text-xs font-semibold px-3 py-2 rounded-xl transition-all"
              style={{ color: '#0d1f3c', border: '1.5px dashed #CBD5E1', background: '#F8FAFC' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#0d1f3c')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#CBD5E1')}>
              <Plus className="w-3.5 h-3.5" /> Nova conversa
            </button>
          </div>

          {/* Lista histórico */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs" style={{ color: '#D1D5DB' }}>Sem conversas ainda</p>
                <p className="text-xs mt-1" style={{ color: '#E5E7EB' }}>Use o menu azul →</p>
              </div>
            )}
            {filteredHistory.map(c => (
              <button key={c.id} onClick={() => openConv(c)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group flex items-start gap-2"
                style={c.id === activeConvId
                  ? { background: 'rgba(13,31,60,0.09)', color: '#0d1f3c', fontWeight: 600 }
                  : { color: '#4B5563' }}
                onMouseEnter={e => { if (c.id !== activeConvId) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (c.id !== activeConvId) e.currentTarget.style.background = 'transparent' }}>
                <span className="flex-shrink-0 mt-0.5">{c.agentEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate leading-snug">{c.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#9CA3AF' }}>
                    {c.messages.filter(m => !m.isLoading).length} msgs
                  </p>
                </div>
                <button onClick={e => {
                  e.stopPropagation()
                  setConversations(prev => prev.filter(cv => cv.id !== c.id))
                  if (activeConvId === c.id) {
                    // Ao fechar conversa de especialista, retorna ao BEN Copilot
                    const copilot = AGENTS.find(a => a.id === COPILOT_AGENT_ID) || AGENTS[0]
                    if (copilot) {
                      openAgent(copilot)
                      onAgentOpened?.(copilot.id)
                    }
                  }
                }} className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                  <Trash2 className="w-3 h-3" style={{ color: '#EF4444' }} />
                </button>
              </button>
            ))}
          </div>

          {/* Dica rodapé */}
          <div className="px-4 py-2 border-t" style={{ borderColor: '#F0F2F5' }}>
            <p className="text-xs text-center" style={{ color: '#CBD5E1' }}>
              Selecione agentes no menu azul
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PAINEL CENTRAL — HEADER FIXO + CHAT CENTRALIZADO
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOPBAR FIXA — BEN ECOSYSTEM IA WORKSPACE ─────── */}
        <div className="flex-shrink-0 border-b"
          style={{
            background: 'linear-gradient(135deg, #0d1f3c 0%, #112240 60%, #0d2d4a 100%)',
            borderColor: '#1a3560',
            boxShadow: '0 2px 12px rgba(13,31,60,0.25)',
          }}>
          <div className="flex items-center justify-between px-4 py-3">

            {/* Colapsar histórico */}
            <button onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg transition-colors flex-shrink-0"
              style={{ color: '#7096C8', background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}>
              <ChevronLeft className="w-4 h-4" style={{ transform: showHistory ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .2s' }} />
            </button>

            {/* ── Centro: Logo + Título ─────────────────────── */}
            <div className="flex-1 flex items-center justify-center gap-3">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <img src="/ben-logo.png" alt="BEN"
                  className="w-10 h-10 rounded-xl object-cover"
                  style={{ border: '2px solid rgba(228,183,30,0.4)', boxShadow: '0 0 12px rgba(228,183,30,0.2)' }}
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }} />
                <div className="w-10 h-10 rounded-xl items-center justify-center hidden"
                  style={{ background: 'linear-gradient(135deg, #E4B71E, #c49b10)', border: '2px solid rgba(228,183,30,0.5)', boxShadow: '0 0 12px rgba(228,183,30,0.2)' }}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                {/* Dot indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: '#22c55e', borderColor: '#0d1f3c' }} />
              </div>

              {/* Texto central */}
              <div className="text-center">
                <h1 className="font-extrabold tracking-wider leading-none" style={{ color: '#E4B71E', fontSize: '15px', letterSpacing: '0.10em' }}>
                  BEN Strategic Intelligence Hub
                </h1>
                <p className="text-xs leading-none mt-1.5 font-semibold tracking-widest uppercase" style={{ color: '#4A6FA5', letterSpacing: '0.18em', fontSize: '9px' }}>
                  Workspace · {AGENTS.length} Agentes · Mauro Monção
                </p>
              </div>
            </div>

            {/* ── Ações direita ────────────────────────────── */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => selectedAgent && openAgent(selectedAgent)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium"
                style={{ color: '#A8C4E0', borderColor: '#1e3a60', background: 'rgba(255,255,255,0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#D0E4FF' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#A8C4E0' }}>
                <Plus className="w-3.5 h-3.5" /> Nova
              </button>
              <button
                onClick={() => {
                  if (artifactOpen) { setArtifactOpen(false) } else {
                    const last = [...messages].reverse().find(m => m.role === 'assistant' && m.content.length > 100)
                    if (last) { setArtifactContent(last.content); setArtifactTitle(selectedAgent?.shortName || 'Resposta'); setArtifactOpen(true) }
                  }
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium"
                style={{
                  color: artifactOpen ? '#E4B71E' : '#A8C4E0',
                  borderColor: artifactOpen ? 'rgba(228,183,30,0.5)' : '#1e3a60',
                  background: artifactOpen ? 'rgba(228,183,30,0.12)' : 'rgba(255,255,255,0.05)',
                }}>
                {artifactOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
                Painel
              </button>
            </div>
          </div>
        </div>

        {/* ── ÁREA DE MENSAGENS + INPUT ─────────────────────── */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

              {/* Empty state — logo BEN + título em destaque azul */}
              {messages.length === 0 && selectedAgent && (
                <div className="flex flex-col items-center justify-center py-16">
                  {/* Logo + título BEN Ecosystem IA Workspace */}
                  <div className="flex flex-col items-center gap-3 mb-10">
                    <div className="relative">
                      <img src="/ben-logo.png" alt="BEN"
                        className="w-16 h-16 rounded-2xl object-cover"
                        style={{ border: '2.5px solid rgba(37,99,235,0.35)', boxShadow: '0 0 20px rgba(37,99,235,0.15)' }}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                          const fb = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fb) fb.style.display = 'flex';
                        }} />
                      <div className="w-16 h-16 rounded-2xl items-center justify-center hidden"
                        style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', border: '2.5px solid rgba(37,99,235,0.4)', boxShadow: '0 0 20px rgba(37,99,235,0.2)' }}>
                        <Sparkles className="w-7 h-7 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                        style={{ background: '#22c55e', borderColor: '#F2F4F8' }} />
                    </div>
                    <div className="text-center">
                      <h2 className="font-extrabold tracking-wide" style={{ color: '#1d4ed8', fontSize: '22px', letterSpacing: '0.04em' }}>
                        BEN Ecosystem IA Workspace
                      </h2>
                      <p className="text-xs mt-1 font-medium" style={{ color: '#6B7280' }}>
                        {selectedAgent.name} · {selectedAgent.model}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagens */}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0 mr-2.5 mt-0.5 shadow-sm"
                      style={{ background: selectedAgent?.accentColor || '#F3F4F6' }}>
                      {selectedAgent?.emoji || '🔱'}
                    </div>
                  )}
                  <div className="max-w-[82%]">
                    {msg.isLoading ? (
                      <div className="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-sm"
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
                        <div className="px-5 py-4 rounded-2xl shadow-sm"
                          style={msg.role === 'user'
                            ? { background: '#0d1f3c', color: '#FFFFFF', borderRadius: '20px 20px 4px 20px' }
                            : { background: '#FFFFFF', color: '#1A1A1A', border: '1px solid #EEEEEE', borderRadius: '20px 20px 20px 4px' }}>
                          {msg.role === 'user'
                            ? <p className="text-sm whitespace-pre-wrap" style={{ color: '#FFFFFF', lineHeight: '1.7' }}>{msg.content}</p>
                            : <MarkdownContent content={msg.content} />}
                        </div>
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
                                <button onClick={() => { setArtifactContent(msg.content); setArtifactTitle(selectedAgent?.shortName || 'Resposta'); setArtifactOpen(true) }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Abrir no painel">
                                  <PanelRight className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                                </button>
                              )}
                              <button onClick={() => {
                                const b = new Blob([msg.content], { type: 'text/plain' })
                                const u = URL.createObjectURL(b)
                                const a = document.createElement('a'); a.href = u; a.download = `ben-${Date.now()}.txt`; a.click()
                              }} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Baixar">
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
          </div>

          {/* ══════════════════════════════════════════════════
              CAIXA DE INPUT CENTRALIZADA — borda azul leve
          ══════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 pb-5 px-4">
            <div className="max-w-3xl mx-auto">

              {/* Preview de anexo */}
              {attachment && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-xs"
                  style={{ background: attachment.parsing ? '#FFFBEB' : '#EFF6FF', border: `1px solid ${attachment.parsing ? '#FCD34D' : '#BFDBFE'}` }}>
                  {attachment.parsing
                    ? <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin" style={{ color: '#D97706' }} />
                    : <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#1d4ed8' }} />
                  }
                  <span className="flex-1 truncate font-medium" style={{ color: attachment.parsing ? '#92400e' : '#1e40af' }}>
                    {attachment.type === 'timbrado'
                      ? '📋 Timbrado padrão inserido'
                      : attachment.parsing
                        ? `⏳ Processando ${attachment.name}...`
                        : `📎 ${attachment.name}${attachment.pages ? ` (${attachment.pages} pág.)` : ''}${attachment.rag_ready ? ' ✅ RAG' : ''}`
                    }
                  </span>
                  {!attachment.parsing && (
                    <button onClick={() => setAttachment(null)}>
                      <X className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                    </button>
                  )}
                </div>
              )}

              {/* ── Caixa principal — borda azul dinâmica ─── */}
              <div className="rounded-2xl transition-all duration-200"
                style={{
                  background: '#FFFFFF',
                  border: inputFocused
                    ? '2px solid #3B82F6'
                    : '2px solid #BFDBFE',
                  boxShadow: inputFocused
                    ? '0 0 0 4px rgba(59,130,246,0.10), 0 4px 20px rgba(59,130,246,0.12)'
                    : '0 2px 12px rgba(59,130,246,0.07)',
                }}>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder={`Mensagem para ${selectedAgent?.shortName || 'BEN'}... (Enter envia · Shift+Enter nova linha)`}
                  rows={1}
                  disabled={loading}
                  className="w-full px-5 pt-4 pb-2 text-sm bg-transparent resize-none focus:outline-none"
                  style={{ color: '#1A1A1A', minHeight: '52px', maxHeight: '180px', lineHeight: '1.6', caretColor: '#3B82F6' }}
                />

                {/* Toolbar inferior */}
                <div className="flex items-center justify-between px-4 pb-3 pt-1">

                  {/* Esquerda — ferramentas de anexo */}
                  <div className="flex items-center gap-1" ref={attachMenuRef}>

                    {/* Botão + (menu de anexos) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium"
                        style={{
                          background: showAttachMenu ? 'rgba(59,130,246,0.1)' : '#F4F6FA',
                          color: showAttachMenu ? '#2563EB' : '#374151',
                          border: `1px solid ${showAttachMenu ? '#93C5FD' : '#E2E8F0'}`,
                        }}
                        title="Anexar / Conectar">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Anexar</span>
                        <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
                      </button>

                      {/* Dropdown menu de anexos */}
                      {showAttachMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-60 rounded-2xl shadow-xl border overflow-hidden z-50"
                          style={{ background: '#FFFFFF', borderColor: '#E8ECF0' }}>

                          <div className="px-3 py-2 border-b" style={{ borderColor: '#F0F2F5', background: '#F8FAFC' }}>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>
                              Anexar / Conectar
                            </p>
                          </div>

                          {/* Arquivo local */}
                          <button onClick={() => { fileRef.current?.click(); setShowAttachMenu(false) }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-blue-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
                              <FileText className="w-3.5 h-3.5" style={{ color: '#1d4ed8' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Documento local</p>
                              <p style={{ color: '#9CA3AF' }}>PDF, DOCX, TXT</p>
                            </div>
                          </button>

                          {/* Imagem */}
                          <button onClick={() => { fileRef.current?.click(); setShowAttachMenu(false) }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-blue-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F5F3FF' }}>
                              <FileImage className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Imagem / Foto</p>
                              <p style={{ color: '#9CA3AF' }}>PNG, JPG, JPEG</p>
                            </div>
                          </button>

                          <div className="my-1 border-t" style={{ borderColor: '#F0F2F5' }} />

                          {/* Timbrado padrão */}
                          <button onClick={insertTimbrado}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-yellow-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FEF3C7' }}>
                              <Stamp className="w-3.5 h-3.5" style={{ color: '#D4A017' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Timbrado padrão</p>
                              <p style={{ color: '#9CA3AF' }}>Insere cabeçalho do escritório</p>
                            </div>
                          </button>

                          {/* Modelo de petição */}
                          <button onClick={() => {
                            setInput(prev => `[MODELO — PETIÇÃO INICIAL]\n\nExmo. Sr. Dr. Juiz de Direito da ___ Vara de ___\n\n[Qualificação das partes]\n\n[Fatos]\n\n[Fundamentos jurídicos]\n\n[Pedidos]\n\n${prev}`)
                            setShowAttachMenu(false)
                            setTimeout(() => textareaRef.current?.focus(), 100)
                          }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-green-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#D1FAE5' }}>
                              <BookOpen className="w-3.5 h-3.5" style={{ color: '#059669' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Modelo de petição</p>
                              <p style={{ color: '#9CA3AF' }}>Estrutura base para peças</p>
                            </div>
                          </button>

                          <div className="my-1 border-t" style={{ borderColor: '#F0F2F5' }} />
                          <div className="px-3 py-1.5 border-b" style={{ borderColor: '#F0F2F5', background: '#F8FAFC' }}>
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6B7280' }}>
                              Abrir externo
                            </p>
                          </div>

                          {/* Gmail */}
                          <button onClick={openGmail}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-red-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
                              <Mail className="w-3.5 h-3.5" style={{ color: '#dc2626' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Gmail</p>
                              <p style={{ color: '#9CA3AF' }}>Abrir e-mail (nova aba)</p>
                            </div>
                          </button>

                          {/* Google Drive */}
                          <button onClick={openDrive}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-blue-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E0F2FE' }}>
                              <FolderOpen className="w-3.5 h-3.5" style={{ color: '#0369a1' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Google Drive</p>
                              <p style={{ color: '#9CA3AF' }}>Abrir arquivos (nova aba)</p>
                            </div>
                          </button>

                          {/* Google Docs */}
                          <button onClick={openDocs}
                            className="w-full flex items-center gap-3 px-4 py-3 text-xs hover:bg-indigo-50 transition-colors text-left">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E0E7FF' }}>
                              <FileText className="w-3.5 h-3.5" style={{ color: '#4f46e5' }} />
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: '#1A1A1A' }}>Google Docs</p>
                              <p style={{ color: '#9CA3AF' }}>Criar documento (nova aba)</p>
                            </div>
                          </button>

                          <div className="pb-1" />
                        </div>
                      )}
                    </div>

                    {/* Pesquisa web */}
                    <button onClick={() => setUseSearch(!useSearch)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all font-medium"
                      style={{
                        background: useSearch ? 'rgba(37,99,235,0.1)' : '#F4F6FA',
                        color: useSearch ? '#2563EB' : '#6B7280',
                        border: `1px solid ${useSearch ? '#93C5FD' : '#E2E8F0'}`,
                      }}
                      title="Pesquisa web em tempo real">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web</span>
                    </button>

                    {/* Áudio (futuro) */}
                    <button
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ background: '#F4F6FA', color: '#9CA3AF', border: '1px solid #E2E8F0', opacity: 0.6 }}
                      title="Áudio — em breve">
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Direita — botão enviar */}
                  <div className="flex items-center gap-2">
                    {/* Botão enviar */}
                    <button onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                      style={{
                        background: loading ? '#6B7280' : (input.trim() ? '#0d1f3c' : '#94A3B8'),
                        boxShadow: input.trim() && !loading ? '0 2px 8px rgba(13,31,60,0.4)' : 'none',
                      }}>
                      {loading
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Send className="w-4 h-4 text-white" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Sugestões abaixo da caixa (só no estado vazio) ── */}
              {messages.length === 0 && selectedAgent && (
                <div className="max-w-3xl mx-auto px-0 mt-3">
                  <div className="grid grid-cols-3 gap-2">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => setInput(s)}
                        className="text-left text-xs px-3 py-2.5 rounded-xl border transition-all"
                        style={{ background: '#FFFFFF', borderColor: '#DBEAFE', color: '#374151' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.color = '#1d4ed8' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#DBEAFE'; e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#374151' }}>
                        <span className="block font-medium leading-snug">{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Linha discreta abaixo: agente ativo + status ── */}
              <div className="flex items-center justify-center gap-3 mt-2 text-xs flex-wrap" style={{ color: '#9CA3AF' }}>
                {selectedAgent && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: selectedAgent.accentColor + '88', color: selectedAgent.color }}>
                    <span>{selectedAgent.emoji}</span>
                    <span className="font-semibold">{selectedAgent.name}</span>
                    {selectedAgent.premium && <span>⭐</span>}
                  </span>
                )}
                {/* Motor Opus/Sonnet oculto — BEN Copilot ativo como padrão */}
                {useSearch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <Globe className="w-3 h-3" /> Web ativa
                  </span>
                )}
                {artifactOpen && artifactContent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: 'rgba(228,183,30,0.15)', color: '#D4A017', border: '1px solid rgba(228,183,30,0.3)' }}>
                    📎 Contexto do artefato ativo — agente revisará o texto gerado
                  </span>
                )}
                {attachment && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: attachment.parsing ? '#FFFBEB' : '#F5F3FF', color: attachment.parsing ? '#92400e' : '#7c3aed' }}>
                    {attachment.parsing ? '⏳' : '📎'} {attachment.name}{attachment.rag_ready ? ' ✅' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          PAINEL ARTIFACT (direita)
      ══════════════════════════════════════════════════════ */}
      {artifactOpen && (
        <div className={`flex-shrink-0 flex flex-col border-l transition-all duration-300 ${artifactFull ? 'fixed inset-0 z-50' : 'w-[44%] min-w-[380px] max-w-[680px]'}`}
          style={{ background: '#FFFFFF', borderColor: '#EEEEEE' }}>

          {/* Header artifact */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
            style={{ background: '#0d1f3c', borderColor: '#1a3060' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(228,183,30,0.25)' }}>
                <FileText className="w-4 h-4" style={{ color: '#E4B71E' }} />
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
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', color: artifactCopied ? '#4ade80' : '#CBD5E1' }}>
                {artifactCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {artifactCopied ? 'Copiado!' : 'Copiar'}
              </button>
              <button onClick={() => downloadArtifact('docx')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#CBD5E1' }}>
                <Download className="w-3.5 h-3.5" /> .docx
              </button>
              <button onClick={() => downloadArtifact('txt')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#94A3B8' }}>
                <FileText className="w-3.5 h-3.5" /> .txt
              </button>
              <button onClick={() => setArtifactFull(!artifactFull)}
                className="p-1.5 rounded-lg" style={{ color: '#CBD5E1' }}>
                {artifactFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setArtifactOpen(false)}
                className="p-1.5 rounded-lg" style={{ color: '#CBD5E1' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <MarkdownContent content={artifactContent} />
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t flex items-center justify-between flex-shrink-0"
            style={{ borderColor: '#F0F0F0', background: '#FAFBFC' }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              ⚠️ Minuta — revisão obrigatória pelo Dr. Mauro Monção
            </span>
            <button onClick={copyArtifact}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#0d1f3c', color: '#E4B71E' }}>
              {artifactCopied ? '✓ Copiado' : 'Copiar tudo'}
            </button>
          </div>
        </div>
      )}

      {/* Input oculto para arquivos */}
      <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp,.gif,.tiff" className="hidden" onChange={e => handleFile(e)} />

      {/* ── Modal: Com timbre ou Sem timbre? ─────────────────── */}
      {timbreModal === 'pending' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="rounded-2xl shadow-2xl p-7 flex flex-col items-center gap-4 w-full mx-4"
            style={{ background: '#0d1f3c', border: '1px solid #1e3a60', maxWidth: 420 }}>

            {/* Ícone + título */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(228,183,30,0.18)' }}>
                <FileText className="w-6 h-6" style={{ color: '#E4B71E' }} />
              </div>
              <p className="text-white font-bold text-base text-center">Gerar documento Word (.docx)</p>
            </div>

            {/* Aviso sobre o timbre */}
            <div className="w-full rounded-xl p-3 text-xs leading-relaxed"
              style={{ background: 'rgba(228,183,30,0.08)', border: '1px solid rgba(228,183,30,0.25)', color: '#CBD5E1' }}>
              <p className="font-semibold mb-1" style={{ color: '#E4B71E' }}>ℹ️ Como funciona o timbre</p>
              <p>O <strong style={{ color: '#fff' }}>timbre do escritório é um arquivo Word separado</strong> (.docx). O sistema extrai o cabeçalho do arquivo de timbre e o aplica ao documento gerado.</p>
              <p className="mt-1">Para usar o timbre, selecione <strong style={{ color: '#4ade80' }}>"Com Timbre"</strong> e anexe o arquivo <strong style={{ color: '#fff' }}>NOVO TIMBRE DO ESCRITÓRIO.docx</strong>. Uma vez carregado, fica salvo na sessão.</p>
            </div>

            {/* Status do timbre salvo */}
            {savedTimbreFile && (
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
                <span>✓</span>
                <span>Timbre em uso: <strong>{savedTimbreFile.name.slice(0, 35)}{savedTimbreFile.name.length > 35 ? '…' : ''}</strong></span>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-2 w-full">

              {/* Botão COM timbre (ativo se já carregado) */}
              {savedTimbreFile ? (
                <button
                  onClick={() => handleTimbreChoice('com')}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: '#E4B71E', color: '#0d1f3c' }}>
                  📋 Com Timbre — usar {savedTimbreFile.name.slice(0, 22)}{savedTimbreFile.name.length > 22 ? '…' : ''}
                </button>
              ) : null}

              {/* Carregar / Trocar arquivo .docx do timbre */}
              <button
                onClick={() => timbreFileRef.current?.click()}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{
                  background: savedTimbreFile ? 'rgba(228,183,30,0.12)' : '#E4B71E',
                  color: savedTimbreFile ? '#E4B71E' : '#0d1f3c',
                  border: savedTimbreFile ? '1px solid rgba(228,183,30,0.4)' : 'none',
                }}>
                📂 {savedTimbreFile ? 'Trocar arquivo de timbre (.docx)' : 'Anexar timbre (.docx) e gerar'}
              </button>

              {/* Sem timbre */}
              <button
                onClick={() => handleTimbreChoice('sem')}
                className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.12)' }}>
                📄 Sem Timbre — gerar apenas o conteúdo
              </button>
            </div>

            <button
              onClick={() => handleTimbreChoice('cancel')}
              className="text-xs transition-colors hover:text-white"
              style={{ color: '#64748B' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Input oculto para o .docx do timbre */}
      <input
        ref={timbreFileRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleTimbreFileUpload}
      />
    </div>
  )
}
