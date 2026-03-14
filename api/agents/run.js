// ============================================================
// BEN ECOSYSTEM IA — Proxy de Agentes v5.1
// Rota: POST /api/agents/run
//
// Roteia automaticamente para:
//   → Growth Center: bengrowth.mauromoncao.adv.br/api/agents/run
//   → Juris Center:  juris.mauromoncao.adv.br/api/agents/run
//
// ── AGENTES GROWTH (7) ──────────────────────────────────────
//   ben-atendente               BEN Atendente Jurídico
//   ben-conteudista             BEN Conteudista Jurídico
//   ben-estrategista-campanhas  BEN Estrategista de Campanhas
//   ben-estrategista-marketing  BEN Estrategista de Marketing Jurídico
//   ben-analista-relatorios     BEN Analista de Relatórios
//   ben-diretor-criativo        BEN Diretor Criativo
//   ben-analista-monitoramento  BEN Analista de Monitoramento
//
// ── AGENTES JURIS (29) ──────────────────────────────────────
//   🔶 ben-agente-operacional-maximus   Claude Opus (thinking)
//   🔷 ben-agente-operacional-premium   Claude Sonnet
//   🟢 ben-agente-operacional-standard  Claude Haiku
//   ⚖️  ben-tributarista-estrategista   Claude Opus (thinking)
//   🏛️  ben-processualista-estrategico  Claude Opus (thinking)
//   ben-pesquisador-juridico            Perplexity
//   ben-engenheiro-prompt               GPT-4o
//   — Contador nível 1 (6) —
//   ben-contador-tributarista           Claude Haiku
//   ben-contador-especialista           Claude Sonnet
//   ben-contador-planejamento           Claude Sonnet
//   ben-contador-creditos               Claude Sonnet
//   ben-contador-auditoria              Claude Sonnet
//   ben-contador-relatorio              Claude Sonnet
//   — Contador Tributarista nível 2 (4) —
//   ben-contador-tributarista-planejamento
//   ben-contador-tributarista-creditos
//   ben-contador-tributarista-auditoria
//   ben-contador-tributarista-relatorio
//   — Perito Forense (7) —
//   ben-perito-forense                  Claude Sonnet
//   ben-perito-forense-profundo         Claude Opus (⚠️ alerta Dr. Mauro)
//   ben-perito-forense-digital
//   ben-perito-forense-laudo
//   ben-perito-forense-contestar
//   ben-perito-forense-relatorio
//   ben-perito-imobiliario
//   — Sistema / Suporte (5) —
//   ben-assistente-geral                GPT-4o (BEN Copilot)
//   ben-assistente-cnj                  Claude Sonnet
//   ben-assistente-voz                  Claude Haiku + ElevenLabs
//   ben-monitor-juridico                Claude Sonnet
// ============================================================

export const config = { maxDuration: 120 }

const GROWTH_URL = (process.env.VITE_GROWTH_API_URL || 'https://bengrowth.mauromoncao.adv.br').trim()
const JURIS_URL  = (process.env.VITE_JURIS_API_URL  || 'https://juris.mauromoncao.adv.br').trim()
const VPS_URL    = (process.env.VPS_LEADS_URL        || 'http://181.215.135.202:3001').trim()

// ── Mapa de agentes → sistema destino ────────────────────────
const GROWTH_AGENTS = new Set([
  // Novos nomes BEN — Growth
  'ben-atendente',
  'ben-conteudista',
  'ben-estrategista-campanhas',
  'ben-estrategista-marketing',
  'ben-analista-relatorios',
  'ben-diretor-criativo',
  'ben-analista-monitoramento',
  // mara-ia (especial)
  'mara-ia',
])

const JURIS_AGENTS = new Set([
  // 🔶 Agentes Operacionais (3)
  'ben-agente-operacional-maximus',
  'ben-agente-operacional-premium',
  'ben-agente-operacional-standard',
  // ⚖️ Estrategistas (2)
  'ben-tributarista-estrategista',
  'ben-processualista-estrategico',
  // Pesquisa & Engenharia (2)
  'ben-pesquisador-juridico',
  'ben-engenheiro-prompt',
  // Contador — nível 1 (6)
  'ben-contador-tributarista',
  'ben-contador-especialista',
  'ben-contador-planejamento',
  'ben-contador-creditos',
  'ben-contador-auditoria',
  'ben-contador-relatorio',
  // Contador Tributarista — nível 2 (4)
  'ben-contador-tributarista-planejamento',
  'ben-contador-tributarista-creditos',
  'ben-contador-tributarista-auditoria',
  'ben-contador-tributarista-relatorio',
  // Perito Forense (7)
  'ben-perito-forense',
  'ben-perito-forense-profundo',
  'ben-perito-forense-digital',
  'ben-perito-forense-laudo',
  'ben-perito-forense-contestar',
  'ben-perito-forense-relatorio',
  'ben-perito-imobiliario',
  // Sistema / Suporte (5)
  'ben-assistente-geral',
  'ben-assistente-cnj',
  'ben-assistente-voz',
  'ben-monitor-juridico',
])

// ── Mapeamento de aliases (compatibilidade retroativa) ────────
const AGENT_ALIASES = {
  // Aliases legados → agente atual
  'ben-super-agente-juridico': 'ben-agente-operacional-maximus',
  // Aliases novos → resolução interna
  'mara-ia': 'mara-ia',
}

function resolveAgentId(agentId) {
  return AGENT_ALIASES[agentId] || agentId
}

function getDestino(agentId) {
  const id = resolveAgentId(agentId)
  if (JURIS_AGENTS.has(id)) return 'juris'
  if (GROWTH_AGENTS.has(id)) return 'growth'
  // Heurística: prefixo "ben-" com subárea jurídica → juris
  if (id.startsWith('ben-contador-') ||
      id.startsWith('ben-perito-') ||
      id.startsWith('ben-pesquisador-') ||
      id.startsWith('ben-engenheiro-') ||
      id.startsWith('ben-processualista-') ||
      id.startsWith('ben-tributarista-')) {
    return 'juris'
  }
  return 'growth'
}

// ── CORS helper ───────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// ── Salvar interação no VPS (assíncrono, não bloqueia) ───────
async function logVPS(agentId, input, output) {
  try {
    await fetch(`${VPS_URL}/leads/mensagem`, {
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

// ═══════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Método não permitido' })

  try {
    const { agentId, input, context = {}, useSearch = false, useMemory = false, clientId, modelOverride } = req.body || {}

    if (!agentId || !input) {
      return res.status(400).json({ error: 'agentId e input são obrigatórios' })
    }

    const resolvedId = resolveAgentId(agentId)
    const destino    = getDestino(agentId)
    const baseUrl    = destino === 'juris' ? JURIS_URL : GROWTH_URL
    const endpoint   = `${baseUrl}/api/agents/run`

    console.log(`[Ecosystem v3.1] ${agentId} → ${destino} (${resolvedId})`)

    const startTime = Date.now()

    // ── Enriquecer contexto com info do Ecosystem ─────────────
    const enrichedContext = {
      ...context,
      source: 'ben-ecosystem-ia',
      ecosystemVersion: '3.1',
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: resolvedId,
        input,
        context: enrichedContext,
        useSearch,
        useMemory,
        clientId,
        modelOverride,
      }),
      signal: AbortSignal.timeout(110000),
    })

    const elapsed = Date.now() - startTime

    if (!response.ok) {
      const errText = await response.text()
      console.error(`[Ecosystem] Erro ${response.status} de ${destino}:`, errText.slice(0, 200))
      return res.status(response.status).json({
        success: false,
        error: `Agente ${agentId} indisponível (${response.status})`,
        destino,
        elapsed_ms: elapsed,
      })
    }

    const data = await response.json()

    // Log assíncrono no VPS (não bloqueia a resposta)
    if (data.output) {
      logVPS(agentId, input, data.output)
    }

    // ── Log de custo no Monitor interno (assíncrono) ─────────
    if (data.usage) {
      fetch(`${process.env.ECOSYSTEM_URL || 'https://ecosystem.mauromoncao.adv.br'}/api/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          modelUsed:    data.modelUsed  || 'unknown',
          inputTokens:  data.usage.inputTokens  || 0,
          outputTokens: data.usage.outputTokens || 0,
          costUsd:      data.usage.costUsd      || 0,
          elapsed_ms:   elapsed,
          timestamp:    new Date().toISOString(),
          source:       destino,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})
    }

    return res.status(200).json({
      ...data,
      destino,
      proxiedBy: 'ben-ecosystem-ia',
      elapsed_ms: elapsed,
    })

  } catch (error) {
    console.error('[Ecosystem Proxy] Erro:', error.message)
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro no proxy do Ecosystem',
    })
  }
}
