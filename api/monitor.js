// ============================================================
// BEN ECOSYSTEM IA — Monitor de Custos de Tokens v1.0
// Rota: GET|POST /api/monitor
// Acesso: RESTRITO — apenas Dr. Mauro (token admin)
//
// Funcionalidades:
//   GET  /api/monitor?action=stats    — estatísticas consolidadas
//   GET  /api/monitor?action=logs     — últimas N execuções
//   GET  /api/monitor?action=daily    — custo por dia (30 dias)
//   GET  /api/monitor?action=by-agent — custo agrupado por agente
//   GET  /api/monitor?action=by-model — custo agrupado por modelo
//   POST /api/monitor (action:log)    — recebe log do Juris/Growth Center
//   POST /api/monitor (action:reset)  — limpa logs (admin apenas)
// ============================================================

export const config = { maxDuration: 20 }

// ── Admin token (env var; fallback para dev) ─────────────────
const ADMIN_TOKEN = (process.env.MONITOR_ADMIN_TOKEN || 'ben_monitor_mauro_2026_secure').trim()

// ── Preços por 1M tokens (USD) ───────────────────────────────
const MODEL_PRICING = {
  'claude-haiku-4-5':       { input: 0.80,  output: 4.00,  label: 'Claude Haiku 4.5',  cor: '#4ADE80' },
  'claude-haiku-fallback':  { input: 0.80,  output: 4.00,  label: 'Claude Haiku (fb)',  cor: '#86EFAC' },
  'claude-sonnet-4-5':      { input: 3.00,  output: 15.00, label: 'Claude Sonnet 4.5', cor: '#60A5FA' },
  'claude-sonnet-fallback': { input: 3.00,  output: 15.00, label: 'Claude Sonnet (fb)', cor: '#93C5FD' },
  'claude-opus-4-5':        { input: 15.00, output: 75.00, label: 'Claude Opus 4.5',   cor: '#F472B6' },
  'gpt-4o':                 { input: 2.50,  output: 10.00, label: 'GPT-4o',             cor: '#FBBF24' },
  'gpt-4o-fallback':        { input: 2.50,  output: 10.00, label: 'GPT-4o (fallback)',  cor: '#FCD34D' },
  'gpt-4o-mini':            { input: 0.15,  output: 0.60,  label: 'GPT-4o Mini',        cor: '#A3E635' },
  'gpt-4o-mini-final':      { input: 0.15,  output: 0.60,  label: 'GPT-4o Mini (fb)',   cor: '#BEF264' },
  'perplexity':             { input: 1.00,  output: 1.00,  label: 'Perplexity',         cor: '#C084FC' },
}

// ── USD → BRL (câmbio fixo; pode ser atualizado via env) ─────
const USD_BRL = parseFloat(process.env.USD_BRL_RATE || '5.75')

// ── Limites de alerta configuráveis ─────────────────────────
const ALERT_DAILY_USD  = parseFloat(process.env.ALERT_DAILY_USD  || '10.00')
const ALERT_MONTHLY_USD = parseFloat(process.env.ALERT_MONTHLY_USD || '200.00')

// ── In-memory store (substituível por VPS/DB) ───────────────
// Em produção, o VPS vai receber os logs e este endpoint consulta
// aqui mantemos um buffer circular de 500 entradas para o painel
const MAX_LOGS = 500
const logBuffer = []   // { id, agentId, modelUsed, inputTokens, outputTokens, costUsd, elapsed_ms, timestamp, source }

function addLog(entry) {
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  logBuffer.unshift({ id, ...entry })
  if (logBuffer.length > MAX_LOGS) logBuffer.splice(MAX_LOGS)
}

// ── Helpers ──────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Monitor-Token')
}

function checkAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['x-monitor-token'] || ''
  const tokenFromQuery = req.query?.token || ''
  return authHeader.includes(ADMIN_TOKEN) || tokenFromQuery === ADMIN_TOKEN
}

function isoDate(ts) {
  return new Date(ts).toISOString().slice(0, 10)
}

function buildStats() {
  const now       = Date.now()
  const todayStr  = isoDate(now)
  const thisMonth = new Date(now).toISOString().slice(0, 7)   // 'YYYY-MM'

  let totalCostUsd = 0, dailyCostUsd = 0, monthlyCostUsd = 0
  let totalInputTok = 0, totalOutputTok = 0
  let totalCalls = logBuffer.length

  const byAgent = {}, byModel = {}, byDay = {}

  for (const log of logBuffer) {
    const cost  = log.costUsd      || 0
    const inTok = log.inputTokens  || 0
    const outTok= log.outputTokens || 0
    const day   = isoDate(log.timestamp)
    const month = log.timestamp?.slice(0, 7)

    totalCostUsd    += cost
    totalInputTok   += inTok
    totalOutputTok  += outTok
    if (day === todayStr)   dailyCostUsd   += cost
    if (month === thisMonth) monthlyCostUsd += cost

    // by agent
    if (!byAgent[log.agentId]) byAgent[log.agentId] = { calls: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 }
    byAgent[log.agentId].calls++
    byAgent[log.agentId].costUsd      += cost
    byAgent[log.agentId].inputTokens  += inTok
    byAgent[log.agentId].outputTokens += outTok

    // by model
    const mKey = log.modelUsed || 'unknown'
    if (!byModel[mKey]) byModel[mKey] = { calls: 0, costUsd: 0, inputTokens: 0, outputTokens: 0, label: MODEL_PRICING[mKey]?.label || mKey, cor: MODEL_PRICING[mKey]?.cor || '#94A3B8' }
    byModel[mKey].calls++
    byModel[mKey].costUsd      += cost
    byModel[mKey].inputTokens  += inTok
    byModel[mKey].outputTokens += outTok

    // by day (últimos 30 dias)
    if (!byDay[day]) byDay[day] = { date: day, costUsd: 0, calls: 0 }
    byDay[day].costUsd += cost
    byDay[day].calls++
  }

  const alerts = []
  if (dailyCostUsd   >= ALERT_DAILY_USD)   alerts.push({ level: 'warning', msg: `Custo diário USD ${dailyCostUsd.toFixed(4)} atingiu limite de $${ALERT_DAILY_USD}` })
  if (monthlyCostUsd >= ALERT_MONTHLY_USD) alerts.push({ level: 'critical', msg: `Custo mensal USD ${monthlyCostUsd.toFixed(2)} atingiu limite de $${ALERT_MONTHLY_USD}` })

  // Ordenar days
  const dailyArray = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  const agentArray  = Object.entries(byAgent).map(([id, v]) => ({ agentId: id, ...v, costBrl: v.costUsd * USD_BRL }))
    .sort((a, b) => b.costUsd - a.costUsd)
  const modelArray  = Object.entries(byModel).map(([id, v]) => ({ modelId: id, ...v, costBrl: v.costUsd * USD_BRL }))
    .sort((a, b) => b.costUsd - a.costUsd)

  return {
    summary: {
      totalCalls,
      totalCostUsd: +totalCostUsd.toFixed(6),
      totalCostBrl: +(totalCostUsd * USD_BRL).toFixed(4),
      dailyCostUsd:  +dailyCostUsd.toFixed(6),
      dailyCostBrl:  +(dailyCostUsd * USD_BRL).toFixed(4),
      monthlyCostUsd: +monthlyCostUsd.toFixed(4),
      monthlyCostBrl: +(monthlyCostUsd * USD_BRL).toFixed(2),
      totalInputTokens: totalInputTok,
      totalOutputTokens: totalOutputTok,
      usdBrlRate: USD_BRL,
      alertas: alerts,
      limites: { dailyUsd: ALERT_DAILY_USD, monthlyUsd: ALERT_MONTHLY_USD },
    },
    byAgent:  agentArray,
    byModel:  modelArray,
    daily:    dailyArray,
  }
}

// ═══════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  // ── POST /api/monitor — receber log do Juris/Growth ──────
  if (req.method === 'POST') {
    const { action, agentId, modelUsed, inputTokens, outputTokens, costUsd, elapsed_ms, timestamp, source } = req.body || {}

    if (action === 'reset') {
      if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })
      logBuffer.splice(0)
      return res.status(200).json({ success: true, msg: 'Logs limpos' })
    }

    // Aceitar log mesmo sem autenticação (vem do backend interno)
    addLog({ agentId: agentId || 'unknown', modelUsed: modelUsed || 'unknown', inputTokens: inputTokens || 0, outputTokens: outputTokens || 0, costUsd: costUsd || 0, elapsed_ms: elapsed_ms || 0, timestamp: timestamp || new Date().toISOString(), source: source || 'ecosystem' })

    return res.status(200).json({ success: true, buffered: logBuffer.length })
  }

  // ── GET /api/monitor — painel admin ──────────────────────
  if (!checkAuth(req)) {
    return res.status(401).json({
      error: 'Acesso restrito — Monitor Administrativo BEN',
      hint: 'Forneça X-Monitor-Token ou ?token=... na requisição',
    })
  }

  const action = req.query?.action || 'stats'
  const stats  = buildStats()

  if (action === 'logs') {
    const limit = parseInt(req.query.limit || '50', 10)
    return res.status(200).json({ success: true, total: logBuffer.length, logs: logBuffer.slice(0, limit) })
  }

  if (action === 'daily')    return res.status(200).json({ success: true, daily: stats.daily })
  if (action === 'by-agent') return res.status(200).json({ success: true, byAgent: stats.byAgent })
  if (action === 'by-model') return res.status(200).json({ success: true, byModel: stats.byModel })

  // default: stats completo
  return res.status(200).json({
    success: true,
    monitor: 'BEN Ecosystem IA — Monitor de Custos',
    versao: '1.0',
    timestamp: new Date().toISOString(),
    ...stats,
    recentLogs: logBuffer.slice(0, 10),
  })
}
