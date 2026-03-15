// ============================================================
// BEN ECOSYSTEM IA — agents/run CF Pages Function v6.0
// Rota: POST /api/agents/run
//
// Roteia para:
//   GROWTH agents → bengrowth.mauromoncao.adv.br/api/agents/run
//   JURIS agents  → juris.mauromoncao.adv.br/api/agents/run
//   SYSTEM agents → juris.mauromoncao.adv.br/api/agents/run (tem ben-assistente-geral)
//
// NOTA: NÃO usa VPS direto (CF Pages bloqueia http://)
// ============================================================

const GROWTH_URL = 'https://bengrowth.mauromoncao.adv.br'
const JURIS_URL  = 'https://juris.mauromoncao.adv.br'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ben-Module',
}

// ── Todos os IDs canônicos GROWTH ────────────────────────────
// Growth agents usam prefixo ben-growth-* no CF Worker
const GROWTH_AGENTS = new Set([
  // Nomes curtos (aliases) → roteados para Growth, que resolve internamente
  'ben-atendente', 'ben-conteudista', 'ben-estrategista-campanhas',
  'ben-estrategista-marketing', 'ben-analista-relatorios',
  'ben-diretor-criativo', 'ben-analista-monitoramento',
  // Nomes canônicos com prefixo growth
  'ben-growth-atendente', 'ben-growth-conteudista', 'ben-growth-campanhas',
  'ben-growth-marketing', 'ben-growth-relatorios', 'ben-growth-criativo',
  'ben-growth-monitoramento',
])

// ── Aliases — Juris legados + Growth (nome curto → canônico ben-growth-*) ─
// Growth aliases resolvidos AQUI para garantir que o CF Worker receba o nome certo
const AGENT_ALIASES = {
  // Juris legados
  'ben-super-agente-juridico': 'ben-agente-operacional-maximus',
  'ben-juridico':              'ben-agente-operacional-premium',
  'ben-copilot':               'ben-assistente-geral',
  'ben-assistente':            'ben-assistente-geral',
  'ben-perito-profundo':       'ben-perito-forense-profundo',
  'ben-perito-digital':        'ben-perito-forense-digital',
  'ben-perito-laudo':          'ben-perito-forense-laudo',
  'ben-perito-contraditorio':  'ben-perito-forense-contestar',
  'ben-perito-relatorio':      'ben-perito-forense-relatorio',
  // Growth: nome curto → nome canônico ben-growth-* (aceito pelo CF Worker)
  'ben-atendente':              'ben-growth-atendente',
  'ben-conteudista':            'ben-growth-conteudista',
  'ben-estrategista-campanhas': 'ben-growth-campanhas',
  'ben-estrategista-marketing': 'ben-growth-marketing',
  'ben-analista-relatorios':    'ben-growth-relatorios',
  'ben-diretor-criativo':       'ben-growth-criativo',
  'ben-analista-monitoramento': 'ben-growth-monitoramento',
}

function resolveAgentId(agentId) {
  return AGENT_ALIASES[agentId] || agentId
}

function getDestino(agentId) {
  const id = resolveAgentId(agentId)
  if (GROWTH_AGENTS.has(id) || GROWTH_AGENTS.has(agentId)) return 'growth'
  if (id.startsWith('ben-growth-') || id.startsWith('ben-atendente') ||
      id.startsWith('ben-conteudista') || id.startsWith('ben-estrategista-') ||
      id.startsWith('ben-analista-') || id.startsWith('ben-diretor-'))
    return 'growth'
  return 'juris'
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed', allowed: ['POST'] }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' },
    })
  }

  try {
    const body = await request.json()
    const { agentId, input } = body

    if (!agentId || !input) {
      return new Response(JSON.stringify({ error: 'agentId e input são obrigatórios' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const destino = getDestino(agentId)
    const backendUrl = destino === 'growth'
      ? `${GROWTH_URL}/api/agents/run`
      : `${JURIS_URL}/api/agents/run`

    // Para Growth: passa o agentId original (Growth center resolve aliases internamente)
    // Para Juris: resolve aliases legados aqui
    const resolvedId = destino === 'growth' ? agentId : resolveAgentId(agentId)

    const startTime = Date.now()

    const proxyReq = new Request(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'cf-pages-ecosystem',
        'X-Ben-Module': request.headers.get('X-Ben-Module') || 'ecosystem',
      },
      body: JSON.stringify({
        ...body,
        agentId: resolvedId,
        context: { ...(body.context || {}), source: 'ben-ecosystem-ia', version: '6.0' },
      }),
    })

    const vpsRes = await fetch(proxyReq)
    const responseBody = await vpsRes.text()
    const elapsed = Date.now() - startTime

    // Parse and enrich response
    let data = {}
    try { data = JSON.parse(responseBody) } catch { data = { output: responseBody } }

    const enriched = {
      ...data,
      destino,
      via: destino + '-cf',
      proxiedBy: 'ben-ecosystem-ia-cf-v6',
      elapsed_ms: elapsed,
    }

    return new Response(JSON.stringify(enriched), {
      status: vpsRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[Ecosystem CF agents/run] Erro:', err)
    return new Response(JSON.stringify({
      success: false,
      error: String(err.message),
      proxy: 'ecosystem-agents-run',
    }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
}
