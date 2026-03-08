// ============================================================
// BEN Workspace — Serviço de API da VPS
// Conecta com: http://181.215.135.202:3002 (PostgreSQL backend)
// ============================================================

const VPS_URL = (import.meta.env.VITE_WORKSPACE_API_URL || 'http://181.215.135.202:3002').trim()

// ── Tipos ────────────────────────────────────────────────────
export interface Project {
  id: string
  titulo: string
  descricao?: string
  area: 'tributario'|'trabalhista'|'previdenciario'|'civil'|'criminal'|'constitucional'|'administrativo'|'empresarial'|'outros'
  status: 'ativo'|'pausado'|'concluido'|'arquivado'
  prioridade: 'baixa'|'media'|'alta'|'urgente'
  cliente?: string
  numero_processo?: string
  valor_causa?: number
  prazo?: string
  tags?: string[]
  total_conversas?: number
  total_documentos?: number
  tarefas_pendentes?: number
  criado_em: string
  atualizado_em: string
}

export interface Conversation {
  id: string
  project_id?: string
  agent_id: string
  titulo: string
  status: 'ativa'|'arquivada'|'exportada'
  total_tokens: number
  total_cost_usd: number
  total_mensagens?: number
  criado_em: string
  atualizado_em: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user'|'assistant'|'system'
  content: string
  agent_id?: string
  model_used?: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  elapsed_ms: number
  criado_em: string
}

export interface Document {
  id: string
  project_id?: string
  titulo: string
  tipo: 'peça_processual'|'contrato'|'parecer'|'laudo'|'relatorio'|'procuracao'|'tese'|'pesquisa'|'outros'
  conteudo: string
  conteudo_html?: string
  status: 'rascunho'|'revisado'|'aprovado'|'assinado'
  agent_id?: string
  versao: number
  tags?: string[]
  criado_em: string
  atualizado_em: string
}

export interface Task {
  id: string
  project_id?: string
  titulo: string
  descricao?: string
  tipo: 'manual'|'automatica'|'agente'|'prazo'
  status: 'pendente'|'em_andamento'|'concluida'|'cancelada'
  prioridade: 'baixa'|'media'|'alta'|'urgente'
  agente_id?: string
  prazo?: string
  resultado?: string
  criado_em: string
}

export interface Pipeline {
  id: string
  titulo: string
  agentes: string[]
  status: 'pendente'|'rodando'|'concluido'|'erro'
  input?: string
  output_final?: string
  steps?: unknown[]
  total_cost_usd: number
  criado_em: string
  concluido_em?: string
}

// ── Cliente HTTP Base ────────────────────────────────────────
class WorkspaceAPI {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('ben_workspace_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('ben_workspace_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('ben_workspace_token')
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('ben_workspace_token')
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => { if (v) url.searchParams.set(k, v) })
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const t = this.getToken()
    if (t) headers['Authorization'] = `Bearer ${t}`

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error((err as { error?: string }).error || `HTTP ${res.status}`)
    }

    return res.json() as Promise<T>
  }

  // ── Health ─────────────────────────────────────────────────
  async health() {
    return this.request<{ status: string; stats: { projects: number; conversations: number } }>('GET', '/health')
  }

  // ── Auth ──────────────────────────────────────────────────
  async login(email: string, senha: string) {
    const r = await this.request<{ success: boolean; token: string; user: { id: string; email: string; nome: string; role: string } }>('POST', '/auth/login', { email, senha })
    if (r.token) this.setToken(r.token)
    return r
  }

  async me() {
    return this.request<{ user: { id: string; email: string; nome: string; role: string; oab: string } }>('GET', '/auth/me')
  }

  // ── Projetos ──────────────────────────────────────────────
  async getProjects(params?: { status?: string; area?: string; limit?: string }) {
    return this.request<{ total: number; projects: Project[] }>('GET', '/projects', undefined, params as Record<string, string>)
  }

  async createProject(data: Partial<Project>) {
    return this.request<{ success: boolean; project: Project }>('POST', '/projects', data)
  }

  async getProject(id: string) {
    return this.request<{
      project: Project
      conversas_recentes: Conversation[]
      documentos_recentes: Document[]
      tarefas_pendentes: Task[]
    }>('GET', `/projects/${id}`)
  }

  async updateProject(id: string, data: Partial<Project>) {
    return this.request<{ success: boolean; project: Project }>('PATCH', `/projects/${id}`, data)
  }

  async deleteProject(id: string) {
    return this.request<{ success: boolean }>('DELETE', `/projects/${id}`)
  }

  // ── Conversas ────────────────────────────────────────────
  async getConversations(params?: { project_id?: string; agent_id?: string }) {
    return this.request<{ conversations: Conversation[] }>('GET', '/conversations', undefined, params as Record<string, string>)
  }

  async createConversation(data: { project_id?: string; agent_id: string; titulo?: string }) {
    return this.request<{ success: boolean; conversation: Conversation }>('POST', '/conversations', data)
  }

  async getConversation(id: string) {
    return this.request<{ conversation: Conversation; messages: Message[] }>('GET', `/conversations/${id}`)
  }

  async addMessage(conversationId: string, data: {
    role: string; content: string; agent_id?: string; model_used?: string
    input_tokens?: number; output_tokens?: number; cost_usd?: number; elapsed_ms?: number
  }) {
    return this.request<{ success: boolean; message: Message }>('POST', `/conversations/${conversationId}/messages`, data)
  }

  async archiveConversation(id: string) {
    return this.request<{ success: boolean }>('DELETE', `/conversations/${id}`)
  }

  // ── Documentos ───────────────────────────────────────────
  async getDocuments(params?: { project_id?: string; tipo?: string; status?: string }) {
    return this.request<{ documents: Document[] }>('GET', '/documents', undefined, params as Record<string, string>)
  }

  async saveDocument(data: {
    project_id?: string; conversation_id?: string
    titulo: string; tipo?: string; conteudo: string
    conteudo_html?: string; agent_id?: string; tags?: string[]
  }) {
    return this.request<{ success: boolean; document: Document }>('POST', '/documents', data)
  }

  async getDocument(id: string) {
    return this.request<{ document: Document }>('GET', `/documents/${id}`)
  }

  async updateDocument(id: string, data: Partial<Document>) {
    return this.request<{ success: boolean; document: Document }>('PATCH', `/documents/${id}`, data)
  }

  async deleteDocument(id: string) {
    return this.request<{ success: boolean }>('DELETE', `/documents/${id}`)
  }

  // ── Tarefas ──────────────────────────────────────────────
  async getTasks(params?: { project_id?: string; status?: string }) {
    return this.request<{ tasks: Task[] }>('GET', '/tasks', undefined, params as Record<string, string>)
  }

  async createTask(data: Partial<Task>) {
    return this.request<{ success: boolean; task: Task }>('POST', '/tasks', data)
  }

  async updateTask(id: string, data: Partial<Task>) {
    return this.request<{ success: boolean; task: Task }>('PATCH', `/tasks/${id}`, data)
  }

  // ── Memória Vetorial ──────────────────────────────────────
  async indexMemory(data: { project_id?: string; document_id?: string; conteudo: string; tipo?: string }) {
    return this.request<{ success: boolean; indexed: { id: string }; hasEmbedding: boolean }>('POST', '/memory/index', data)
  }

  async searchMemory(data: { query: string; project_id?: string; limit?: number }) {
    return this.request<{ success: boolean; results: { id: string; tipo: string; conteudo: string; similarity: number }[] }>('POST', '/memory/search', data)
  }

  // ── Pipelines ────────────────────────────────────────────
  async runPipeline(data: { project_id?: string; titulo?: string; agentes: string[]; input: string }) {
    return this.request<{ success: boolean; pipeline_id: string; status: string; msg: string }>('POST', '/pipelines', data)
  }

  async getPipelines(params?: { project_id?: string }) {
    return this.request<{ pipelines: Pipeline[] }>('GET', '/pipelines', undefined, params as Record<string, string>)
  }

  async getPipeline(id: string) {
    return this.request<{ pipeline: Pipeline }>('GET', `/pipelines/${id}`)
  }

  // ── Monitor (admin) ───────────────────────────────────────
  async getMonitorStats(adminToken: string) {
    const url = `${this.baseUrl}/monitor/stats?token=${encodeURIComponent(adminToken)}`
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) })
    return r.json()
  }

  async logTokenUsage(data: {
    agentId: string; modelUsed: string
    inputTokens: number; outputTokens: number; costUsd: number
    elapsed_ms: number; source?: string
  }) {
    // Fire and forget — não bloqueia UI
    fetch(`${this.baseUrl}/monitor/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => {})
  }
}

// ── Singleton exportado ──────────────────────────────────────
export const workspaceAPI = new WorkspaceAPI(VPS_URL)
export default workspaceAPI
