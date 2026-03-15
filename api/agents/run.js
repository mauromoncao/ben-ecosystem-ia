// ============================================================
// BEN ECOSYSTEM IA — Proxy de Agentes v6.0
// Rota: POST /api/agents/run
//
// Roteia para:
//   1° VPS Agents Server :3188 (35 agentes, IDs canônicos completos)
//   2° Juris Center: juris.mauromoncao.adv.br/api/agents/run
//   3° Growth Center: bengrowth.mauromoncao.adv.br/api/agents/run
//
// ── TODOS OS AGENTES (35) ────────────────────────────────────
//   JURIS (28): maximus, premium, standard, tributarista,
//     processualista, pesquisador, engenheiro, contador (9),
//     perito (7), assistente-geral, assistente-cnj, voz, monitor-juridico
//   GROWTH (7): atendente, conteudista, campanhas, marketing,
//     relatorios, criativo, monitoramento
// ============================================================

export const config = { maxDuration: 120 }

const VPS_AGENTS_URL = 'http://181.215.135.202:3188'
const GROWTH_URL     = (process.env.VITE_GROWTH_API_URL || 'https://bengrowth.mauromoncao.adv.br').trim()
const JURIS_URL      = (process.env.VITE_JURIS_API_URL  || 'https://juris.mauromoncao.adv.br').trim()
const VPS_LEADS_URL  = (process.env.VPS_LEADS_URL       || 'http://181.215.135.202:3001').trim()

// ── TODOS os IDs canônicos ────────────────────────────────────
const GROWTH_AGENTS = new Set([
  'ben-atendente', 'ben-conteudista', 'ben-estrategista-campanhas',
  'ben-estrategista-marketing', 'ben-analista-relatorios',
  'ben-diretor-criativo', 'ben-analista-monitoramento',
  // mara-ia: NATIVA do Growth Center — NÃO rotear pelo Ecosystem (regra canônica)
  // aliases growth
  'ben-growth-atendente', 'ben-growth-conteudista', 'ben-growth-campanhas',
  'ben-growth-marketing', 'ben-growth-relatorios', 'ben-growth-criativo',
  'ben-growth-monitoramento',
])

const JURIS_AGENTS = new Set([
  'ben-agente-operacional-maximus', 'ben-agente-operacional-premium', 'ben-agente-operacional-standard',
  'ben-tributarista-estrategista', 'ben-processualista-estrategico',
  'ben-pesquisador-juridico', 'ben-engenheiro-prompt',
  'ben-contador-tributarista', 'ben-contador-especialista', 'ben-contador-planejamento',
  'ben-contador-creditos', 'ben-contador-auditoria', 'ben-contador-relatorio',
  'ben-contador-tributarista-planejamento', 'ben-contador-tributarista-creditos',
  'ben-contador-tributarista-auditoria', 'ben-contador-tributarista-relatorio',
  'ben-perito-forense', 'ben-perito-forense-profundo', 'ben-perito-forense-digital',
  'ben-perito-forense-laudo', 'ben-perito-forense-contestar', 'ben-perito-forense-relatorio',
  'ben-perito-imobiliario',
  'ben-assistente-geral', 'ben-assistente-cnj', 'ben-assistente-voz', 'ben-monitor-juridico',
  // aliases curtos (CF Worker legado)
  'ben-perito-profundo', 'ben-perito-digital', 'ben-perito-laudo',
  'ben-perito-contraditorio', 'ben-perito-relatorio',
])

// ── Aliases: ID recebido → ID canônico VPS ────────────────────
const AGENT_ALIASES = {
  // Legados
  'ben-super-agente-juridico':   'ben-agente-operacional-maximus',
  'ben-juridico':                'ben-agente-operacional-premium',
  'ben-copilot':                 'ben-assistente-geral',
  'ben-assistente':              'ben-assistente-geral',
  // CF Worker short → canonical full
  'ben-perito-profundo':         'ben-perito-forense-profundo',
  'ben-perito-digital':          'ben-perito-forense-digital',
  'ben-perito-laudo':            'ben-perito-forense-laudo',
  'ben-perito-contraditorio':    'ben-perito-forense-contestar',
  'ben-perito-relatorio':        'ben-perito-forense-relatorio',
  'ben-contador-auditoria':      'ben-contador-tributarista-auditoria',
  'ben-contador-creditos':       'ben-contador-tributarista-creditos',
  'ben-contador-relatorio':      'ben-contador-tributarista-relatorio',
  // Growth aliases
  'ben-growth-atendente':        'ben-atendente',
  'ben-growth-conteudista':      'ben-conteudista',
  'ben-growth-campanhas':        'ben-estrategista-campanhas',
  'ben-growth-marketing':        'ben-estrategista-marketing',
  'ben-growth-relatorios':       'ben-analista-relatorios',
  'ben-growth-criativo':         'ben-diretor-criativo',
  'ben-growth-monitoramento':    'ben-analista-monitoramento',
}

function resolveAgentId(agentId) {
  return AGENT_ALIASES[agentId] || agentId
}

function getDestino(agentId) {
  const id = resolveAgentId(agentId)
  if (GROWTH_AGENTS.has(id) || GROWTH_AGENTS.has(agentId)) return 'growth'
  if (JURIS_AGENTS.has(id) || JURIS_AGENTS.has(agentId)) return 'juris'
  if (id.startsWith('ben-contador-') || id.startsWith('ben-perito-') ||
      id.startsWith('ben-pesquisador-') || id.startsWith('ben-engenheiro-') ||
      id.startsWith('ben-processualista-') || id.startsWith('ben-tributarista-'))
    return 'juris'
  if (id.startsWith('ben-growth-') || id.startsWith('ben-atendente') ||
      id.startsWith('ben-conteudista') || id.startsWith('ben-estrategista-') ||
      id.startsWith('ben-analista-') || id.startsWith('ben-diretor-'))
    return 'growth'
  return 'juris'
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function logVPS(agentId, input, output) {
  try {
    await fetch(`${VPS_LEADS_URL}/leads/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: `ecosystem-${agentId}`,
        role: 'assistant',
        texto: `[${agentId}] ${output.slice(0, 300)}`,
      }),
      signal: AbortSignal.timeout(3000),
    })
  } catch { /* silencioso */ }
}

async function callWithFallback(resolvedId, originalId, payload, destino) {
  const errors = []
  
  // 1° Tentativa: VPS Agents Server (IDs completos, mais rápido)
  try {
    const r = await fetch(`${VPS_AGENTS_URL}/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, agentId: resolvedId }),
      signal: AbortSignal.timeout(30000),
    })
    if (r.ok) {
      const data = await r.json()
      if (data.success) return { data, via: 'vps-3188' }
    }
    errors.push('VPS 3188: ' + r.status)
  } catch (e) { errors.push('VPS 3188: ' + e.message) }

  // 2° Fallback: Juris ou Growth CF backend
  const backendUrl = destino === 'juris'
    ? `${JURIS_URL}/api/agents/run`
    : `${GROWTH_URL}/api/agents/run`
  
  try {
    const r = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, agentId: resolvedId }),
      signal: AbortSignal.timeout(90000),
    })
    if (r.ok) {
      const data = await r.json()
      if (data.success) return { data, via: destino + '-cf' }
    }
    const txt = await r.text().catch(() => '')
    errors.push(`${destino} CF ${r.status}: ${txt.slice(0,100)}`)
  } catch (e) { errors.push(destino + ' CF: ' + e.message) }

  throw new Error('Todos os backends falharam: ' + errors.join(' | '))
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const { agentId, input, context = {}, useSearch = false, useMemory = false, clientId, modelOverride } = req.body || {}

    if (!agentId || !input) {
      return res.status(400).json({ error: 'agentId e input são obrigatórios' })
    }

    const resolvedId = resolveAgentId(agentId)
    const destino    = getDestino(agentId)

    console.log(`[Ecosystem v6.0] ${agentId} → ${resolvedId} → ${destino}`)

    const startTime = Date.now()
    const payload = {
      agentId: resolvedId,
      input,
      context: { ...context, source: 'ben-ecosystem-ia', version: '6.0' },
      useSearch, useMemory, clientId, modelOverride,
    }

    const { data, via } = await callWithFallback(resolvedId, agentId, payload, destino)
    const elapsed = Date.now() - startTime

    if (data.output) logVPS(agentId, input, data.output)

    if (data.usage) {
      fetch(`${process.env.ECOSYSTEM_URL || 'https://ecosystem.mauromoncao.adv.br'}/api/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId, modelUsed: data.modelUsed || 'unknown',
          inputTokens: data.usage.inputTokens || 0,
          outputTokens: data.usage.outputTokens || 0,
          costUsd: data.usage.costUsd || 0,
          elapsed_ms: elapsed, timestamp: new Date().toISOString(), source: destino,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})
    }

    return res.status(200).json({
      ...data, destino, via, proxiedBy: 'ben-ecosystem-ia-v6', elapsed_ms: elapsed,
    })

  } catch (error) {
    console.error('[Ecosystem v6 Proxy] Erro:', error.message)
    return res.status(500).json({
      success: false, error: error.message || 'Erro no proxy do Ecosystem',
    })
  }
}
