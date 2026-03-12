// ============================================================
// BEN ECOSYSTEM IA — Proxy de Agentes v4.0
// Rota: POST /api/agents/run
//
// Roteia automaticamente para:
//   → Growth Center: ben-growth-center.vercel.app/api/agents/run
//   → Juris Center:  ben-juris-center.vercel.app/api/agents/run
//
// ── AGENTES GROWTH (9) ──────────────────────────────────────
//   ben-atendente               BEN Atendente Jurídico
//   ben-conteudista             BEN Conteudista Jurídico
//   ben-estrategista-campanhas  BEN Estrategista de Campanhas
//   ben-estrategista-marketing  BEN Estrategista de Marketing Jurídico
//   ben-analista-relatorios     BEN Analista de Relatórios
//   ben-diretor-criativo        BEN Diretor Criativo
//   ben-analista-monitoramento  BEN Analista de Monitoramento
//   ben-revisor-juridico        BEN Revisor Jurídico
//   ben-peticionista            BEN Peticionista
//
// ── AGENTES JURIS (30) ──────────────────────────────────────
//   ⭐ ben-super-agente-juridico        AGENTE OPERACIONAL MAXIMUS (Claude Opus 4.6)
//   🔷 ben-agente-operacional-premium   AGENTE OPERACIONAL PREMIUM (Claude Sonnet 4.6)
//   🟢 ben-agente-operacional-standard  AGENTE OPERACIONAL STANDARD (Claude Haiku 4.5)
//   ben-peticionista-juridico           BEN Peticionista Jurídico
//   ben-contratualista                  BEN Contratualista
//   ben-mandatario-juridico             BEN Mandatário Jurídico
//   ben-analista-processual             BEN Analista Processual
//   ben-auditor-processual              BEN Auditor Processual
//   ben-gestor-juridico                 BEN Gestor Jurídico
//   ben-tributarista                    BEN Tributarista
//   ben-trabalhista                     BEN Trabalhista
//   ben-previdenciarista                BEN Previdenciarista
//   ben-constitucionalista              BEN Constitucionalista
//   ben-especialista-compliance         BEN Especialista em Compliance
//   ben-pesquisador-juridico            BEN Pesquisador Jurídico
//   ben-relator-juridico                BEN Relator Jurídico
//   ben-redator-juridico                BEN Redator Jurídico
//   ben-engenheiro-prompt               BEN Engenheiro de Prompt
//   ben-contador-tributarista           Triagem Haiku 4.5
//   ben-contador-tributarista-especialista  Especialista Sonnet 4.6
//   ben-contador-tributarista-planejamento
//   ben-contador-tributarista-creditos
//   ben-contador-tributarista-auditoria
//   ben-contador-tributarista-relatorio
//   ben-perito-forense                  Padrão Sonnet 4.6 (5 módulos)
//   ben-perito-forense-profundo         Profundo Opus 4.6 (⚠️ alerta Dr. Mauro)
//   ben-perito-forense-digital
//   ben-perito-forense-laudo
//   ben-perito-forense-contestar
//   ben-perito-forense-relatorio
// ============================================================

export const config = { maxDuration: 120 }

const GROWTH_URL = (process.env.VITE_GROWTH_API_URL || 'https://ben-growth-center.vercel.app').trim()
const JURIS_URL  = (process.env.VITE_JURIS_API_URL  || 'https://ben-juris-center.vercel.app').trim()
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
  'ben-revisor-juridico',
  'ben-peticionista',
  // mara-ia (especial)
  'mara-ia',
])

const JURIS_AGENTS = new Set([
  // ⭐ Agente Operacional Maximus (1)
  'ben-super-agente-juridico',
  // 🔷 Agente Operacional Premium (1)
  'ben-agente-operacional-premium',
  // 🟢 Agente Operacional Standard (1)
  'ben-agente-operacional-standard',
  // ⚖️ Agente Tributarista Estrategista (1)
  'ben-tributarista-estrategista',
  // Jurídicos core (15)
  'ben-peticionista-juridico',
  'ben-contratualista',
  'ben-mandatario-juridico',
  'ben-analista-processual',
  'ben-auditor-processual',
  'ben-gestor-juridico',
  'ben-tributarista',
  'ben-trabalhista',
  'ben-previdenciarista',
  'ben-constitucionalista',
  'ben-especialista-compliance',
  'ben-pesquisador-juridico',
  'ben-relator-juridico',
  'ben-redator-juridico',
  'ben-engenheiro-prompt',
  // Contador Tributarista (6) — Arquitetura 2 níveis
  'ben-contador-tributarista',
  'ben-contador-tributarista-especialista',
  'ben-contador-tributarista-planejamento',
  'ben-contador-tributarista-creditos',
  'ben-contador-tributarista-auditoria',
  'ben-contador-tributarista-relatorio',
  // Perito Forense (6) — Arquitetura 2 níveis
  'ben-perito-forense',
  'ben-perito-forense-profundo',
  'ben-perito-forense-digital',
  'ben-perito-forense-laudo',
  'ben-perito-forense-contestar',
  'ben-perito-forense-relatorio',
])

// ── Mapeamento de aliases (compatibilidade retroativa) ────────
const AGENT_ALIASES = {
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
  if (id.startsWith('ben-peticionista-') || id.startsWith('ben-contador-') ||
      id.startsWith('ben-perito-') || id.startsWith('ben-auditor-') ||
      id.startsWith('ben-analista-processual') || id === 'ben-tributarista' ||
      id === 'ben-trabalhista' || id === 'ben-previdenciarista' ||
      id === 'ben-constitucionalista' || id.startsWith('ben-especialista-') ||
      id.startsWith('ben-pesquisador-') || id.startsWith('ben-relator-') ||
      id.startsWith('ben-redator-') || id.startsWith('ben-engenheiro-') ||
      id.startsWith('ben-contratualista') || id.startsWith('ben-mandatario-') ||
      id.startsWith('ben-gestor-')) {
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
    const { agentId, input, context = {}, useSearch = false, useMemory = false, clientId } = req.body || {}

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
      fetch(`${process.env.ECOSYSTEM_URL || 'https://ben-ecosystem-ia.vercel.app'}/api/monitor`, {
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
