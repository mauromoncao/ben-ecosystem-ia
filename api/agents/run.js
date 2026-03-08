// ============================================================
// BEN ECOSYSTEM IA — Proxy de Agentes v2.0
// Rota: POST /api/agents/run
//
// Roteia automaticamente para:
//   → Growth Center: ben-growth-center.vercel.app/api/agents/run
//   → Juris Center:  ben-juris-center.vercel.app/api/agents/run
//
// Agentes Growth: dr-ben, mara-ia, lex-conteudo, lex-campanhas,
//                 lex-relatorio, lex-monitor, lex-marketing
// Agentes Juris:  dr-ben-peticoes, dr-ben-contratos, dr-ben-procuracoes,
//                 dr-ben-analise-processo, dr-ben-auditoria-processual,
//                 dr-ben-fiscal, dr-ben-trabalhista, dr-ben-previdenciario,
//                 dr-ben-constitucional, dr-ben-compliance, dr-ben-pesquisa,
//                 dr-ben-relatorio, dr-ben-producao, dr-ben-admin,
//                 dr-ben-engenheiro
// ============================================================

export const config = { maxDuration: 65 }

const GROWTH_URL = (process.env.VITE_GROWTH_API_URL || 'https://ben-growth-center.vercel.app').trim()
const JURIS_URL  = (process.env.VITE_JURIS_API_URL  || 'https://ben-juris-center.vercel.app').trim()
const VPS_URL    = (process.env.VPS_LEADS_URL        || 'http://181.215.135.202:3001').trim()

// ── Mapa de agentes → sistema destino ────────────────────────
const GROWTH_AGENTS = new Set([
  'dr-ben', 'mara-ia', 'lex-conteudo', 'lex-campanhas',
  'lex-relatorio', 'lex-monitor', 'lex-marketing', 'lex-juridico',
  'lex-peticoes', 'lex-criativo',
])

const JURIS_AGENTS = new Set([
  'dr-ben-peticoes', 'dr-ben-contratos', 'dr-ben-procuracoes',
  'dr-ben-analise-processo', 'dr-ben-auditoria-processual',
  'dr-ben-fiscal', 'dr-ben-trabalhista', 'dr-ben-previdenciario',
  'dr-ben-constitucional', 'dr-ben-compliance', 'dr-ben-pesquisa',
  'dr-ben-relatorio', 'dr-ben-producao', 'dr-ben-admin',
  'dr-ben-engenheiro',
  // Contador IA (5)
  'dr-ben-contador-fiscal', 'dr-ben-contador-planejamento',
  'dr-ben-contador-creditos', 'dr-ben-contador-inconsistencias',
  'dr-ben-contador-relatorio',
  // Perito IA (5)
  'dr-ben-perito-documentos', 'dr-ben-perito-digital',
  'dr-ben-perito-laudo', 'dr-ben-perito-contestar',
  'dr-ben-perito-relatorio',
  // Aliases usados no Ecosystem UI
  'dr-ben-auditoria', 'dr-ben-analise',
])

// ── Mapeamento de aliases ─────────────────────────────────────
const AGENT_ALIASES = {
  'dr-ben-auditoria': 'dr-ben-auditoria-processual',
  'dr-ben-analise':   'dr-ben-analise-processo',
  'mara-ia':          'mara-ia',
}

function resolveAgentId(agentId) {
  return AGENT_ALIASES[agentId] || agentId
}

function getDestino(agentId) {
  const id = resolveAgentId(agentId)
  if (JURIS_AGENTS.has(id)) return 'juris'
  if (GROWTH_AGENTS.has(id)) return 'growth'
  // Heurística: prefixo "dr-ben-" sem ser dr-ben puro → juris
  if (id.startsWith('dr-ben-')) return 'juris'
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
    const { agentId, input, context = {}, useSearch = false, useMemory = false, clientId } = req.body || {}

    if (!agentId || !input) {
      return res.status(400).json({ error: 'agentId e input são obrigatórios' })
    }

    const resolvedId = resolveAgentId(agentId)
    const destino    = getDestino(agentId)
    const baseUrl    = destino === 'juris' ? JURIS_URL : GROWTH_URL
    const endpoint   = `${baseUrl}/api/agents/run`

    console.log(`[Ecosystem] ${agentId} → ${destino} (${resolvedId})`)

    const startTime = Date.now()

    // ── Enriquecer contexto com info do Ecosystem ─────────────
    const enrichedContext = {
      ...context,
      source: 'ben-ecosystem-ia',
      ecosystemVersion: '2.0',
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
      }),
      signal: AbortSignal.timeout(60000),
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
