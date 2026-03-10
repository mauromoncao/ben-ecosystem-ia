// ─── Tipos compartilhados do BEN Ecosystem IA Mobile ───────────────────────

export type Project       = 'growth' | 'juris'
export type AgentCategory = 'atendimento' | 'juridico' | 'marketing' | 'sistema' | 'contador' | 'perito'
export type ModuleStatus  = 'online' | 'offline' | 'degraded' | 'checking'

export interface Agent {
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

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  base64?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: string
  agentName?: string
  timestamp: string
  attachments?: Attachment[]
  isLoading?: boolean
  modelUsed?: string
  destino?: string
  elapsed_ms?: number
}

export interface Conversation {
  id: string
  title: string
  agentId: string
  agentName: string
  agentEmoji: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  project: Project | 'both'
  starred?: boolean
  tags?: string[]
}

export interface EcosystemStatus {
  growth: ModuleStatus
  juris: ModuleStatus
  vps: ModuleStatus
  lastCheck?: string
}

export interface UserProfile {
  email: string
  nome: string
  source?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
}

// ─── Navigation Types ───────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined
  MainDrawer: undefined
  Chat: { agentId: string; conversationId?: string }
}

export type DrawerParamList = {
  Workspace: undefined
  History: undefined
  Monitor: undefined
}
