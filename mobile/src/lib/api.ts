import { API_BASE_URL } from './agents'
import { Message } from '../types'

interface SendMessageParams {
  agentId: string
  input: string
  history: { role: string; content: string }[]
  useSearch?: boolean
  letterhead?: boolean
}

interface SendMessageResult {
  output: string
  modelUsed: string
  destino: string
  elapsed_ms: number
  error?: string
}

export async function sendAgentMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 65000)

  try {
    const res = await fetch(`${API_BASE_URL}/api/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: params.agentId,
        input: params.input,
        context: {
          history: params.history,
          letterhead: params.letterhead || false,
        },
        useSearch: params.useSearch || params.agentId === 'ben-pesquisador-juridico',
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const d = await res.json()
      return {
        output: d.output || d.result || d.resposta || d.content || JSON.stringify(d),
        modelUsed: d.modelUsed || d.model || '',
        destino: d.destino || '',
        elapsed_ms: d.elapsed_ms || 0,
      }
    } else {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
  } catch (e: unknown) {
    clearTimeout(timeoutId)
    throw e
  }
}

export async function checkSystemStatus(): Promise<{
  growth: string
  juris: string
  vps: string
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/bridge?action=status`, {
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const d = await res.json()
      return {
        growth: d.modulos?.growth?.status || 'offline',
        juris: d.modulos?.juris?.status || 'offline',
        vps: d.modulos?.vps?.status || 'offline',
      }
    }
  } catch { /* silent */ }
  return { growth: 'offline', juris: 'offline', vps: 'offline' }
}

export function buildHistoryFromMessages(messages: Message[]): { role: string; content: string }[] {
  return messages
    .filter(m => !m.isLoading)
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content }))
}
