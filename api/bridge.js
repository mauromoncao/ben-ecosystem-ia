// ============================================================
// BEN ECOSYSTEM IA — Integration Bridge Hub v2.0
// Rota: GET|POST /api/bridge
//
// Hub central de comunicação entre os 3 sistemas:
//   ecosystem.mauromoncao.adv.br  ←→  ben-growth-center
//   ecosystem.mauromoncao.adv.br  ←→  ben-juris-center
//
// VPS Hostinger: 181.215.135.202:3001 (SQLite leads)
// ============================================================

export const config = { maxDuration: 30 }

const GROWTH_URL    = (process.env.VITE_GROWTH_API_URL || 'https://bengrowth.mauromoncao.adv.br').trim()
const JURIS_URL     = (process.env.VITE_JURIS_API_URL  || 'https://juris.mauromoncao.adv.br').trim()
const VPS_URL       = (process.env.VPS_LEADS_URL       || 'http://181.215.135.202:3001').trim()
const BRIDGE_SECRET = (process.env.JWT_SECRET          || 'ben_jwt_mauro_moncao_2026_enterprise_secret_key_advogados').trim()

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Ben-Module')
}

function gerarId() {
  return `eco-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ── Fetch com timeout ─────────────────────────────────────────
async function safeFetch(url, options = {}, timeoutMs = 8000) {
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = await res.json()
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

// ── Consultar status de cada módulo ──────────────────────────
async function checkModuleStatus(url, modulo) {
  const r = await safeFetch(`${url}/api/bridge?action=status`, {}, 5000)
  if (r.ok && r.data?.success) {
    return { modulo, status: 'online', versao: r.data.versao, url }
  }
  // Tenta health básico
  const h = await safeFetch(`${url}/api/health`, {}, 4000)
  return {
    modulo,
    status: h.ok ? 'degraded' : 'offline',
    url,
    erro: r.error || 'sem resposta',
  }
}

// ── Consultar VPS Hostinger ───────────────────────────────────
async function checkVPS() {
  const r = await safeFetch(`${VPS_URL}/health`, {}, 5000)
  if (r.ok && r.data?.status === 'ok') {
    return { modulo: 'vps-hostinger', status: 'online', leads: r.data.leads, uptime: r.data.uptime, url: VPS_URL }
  }
  return { modulo: 'vps-hostinger', status: 'offline', url: VPS_URL, erro: r.error }
}

// ═══════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const action = req.method === 'GET'
    ? req.query.action
    : (req.body?.action || req.query.action)

  try {
    // ── GET status — health check dos 3 sistemas + VPS ────────
    if (action === 'status' || (!action && req.method === 'GET')) {
      const [growth, juris, vps] = await Promise.all([
        checkModuleStatus(GROWTH_URL, 'ben-growth-center'),
        checkModuleStatus(JURIS_URL,  'ben-juris-center'),
        checkVPS(),
      ])

      const allOnline = [growth, juris, vps].every(m => m.status === 'online')

      return res.status(200).json({
        success: true,
        ecosystem: 'ben-ecosystem-ia',
        versao: '2.0',
        status: allOnline ? 'online' : 'parcial',
        timestamp: new Date().toISOString(),
        modulos: { growth, juris, vps },
        bridge_secret_configured: !!process.env.JWT_SECRET,
      })
    }

    // ── GET leads — buscar leads do VPS ───────────────────────
    if (action === 'leads' && req.method === 'GET') {
      const r = await safeFetch(`${VPS_URL}/leads`, {}, 6000)
      if (r.ok) return res.status(200).json({ success: true, ...r.data, fonte: 'vps' })
      return res.status(200).json({ success: false, leads: [], erro: r.error })
    }

    // ── POST enviar_evento — emite evento para Growth ou Juris ─
    if (action === 'enviar_evento' && req.method === 'POST') {
      const { tipo, destino = 'juris', payload = {}, agenteOrigem } = req.body
      if (!tipo) return res.status(400).json({ error: 'tipo é obrigatório' })

      const targetUrl = destino === 'juris'
        ? `${JURIS_URL}/api/bridge`
        : `${GROWTH_URL}/api/bridge`

      const evento = {
        id: gerarId(),
        tipo,
        origem: 'ecosystem',
        destino,
        timestamp: new Date().toISOString(),
        payload,
        status: 'pendente',
        agenteOrigem: agenteOrigem || 'Ben Ecosystem IA',
      }

      const r = await safeFetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ben-Module': 'ecosystem',
          Authorization: `Bearer ${BRIDGE_SECRET}`,
        },
        body: JSON.stringify({ action: 'receber_evento', evento }),
      }, 8000)

      evento.status = r.ok ? 'entregue' : 'erro'
      console.log(`[Bridge Ecosystem→${destino}]`, tipo, r.ok ? '✅' : '❌')

      return res.status(200).json({ success: r.ok, evento, destino_resposta: r.data })
    }

    // ── POST enviar_lead — encaminha lead do Ecosystem ao Growth + Juris
    if (action === 'enviar_lead' && req.method === 'POST') {
      const { nome, telefone, email, area, score, valorEstimado, urgencia } = req.body

      const payload = { nome, telefone, email, area, score, valorEstimado, urgencia, origem: 'ecosystem' }

      // Salvar no VPS
      const vpsR = await safeFetch(`${VPS_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone, area, urgencia, resumo: `Lead via Ecosystem — Área: ${area}` }),
      }, 5000)

      // Notificar Growth
      const growthR = await safeFetch(`${GROWTH_URL}/api/bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${BRIDGE_SECRET}` },
        body: JSON.stringify({ action: 'enviar_lead', ...payload }),
      }, 8000)

      return res.status(200).json({
        success: true,
        mensagem: `Lead ${nome} encaminhado ao ecossistema`,
        vps: vpsR.ok ? 'salvo' : 'falhou',
        growth: growthR.ok ? 'notificado' : 'falhou',
      })
    }

    // ── POST sincronizar — pull de eventos de ambos módulos ───
    if (action === 'sincronizar' && req.method === 'POST') {
      const [growthEvts, jurisEvts] = await Promise.all([
        safeFetch(`${GROWTH_URL}/api/bridge?action=listar&modulo=growth`, {}, 6000),
        safeFetch(`${JURIS_URL}/api/bridge?action=listar&modulo=juris`,   {}, 6000),
      ])

      return res.status(200).json({
        success: true,
        mensagem: 'Sincronização concluída',
        growth_eventos: growthEvts.ok ? (growthEvts.data?.eventos?.length || 0) : 0,
        juris_eventos:  jurisEvts.ok  ? (jurisEvts.data?.eventos?.length  || 0) : 0,
        timestamp: new Date().toISOString(),
      })
    }

    // ── POST receber_evento — aceita eventos vindos do Growth/Juris
    if (action === 'receber_evento' && req.method === 'POST') {
      const authHeader = req.headers.authorization || ''
      if (BRIDGE_SECRET && !authHeader.includes(BRIDGE_SECRET)) {
        return res.status(401).json({ error: 'Não autorizado' })
      }
      const { evento } = req.body
      if (!evento) return res.status(400).json({ error: 'evento ausente' })

      console.log('[Bridge Ecosystem] Evento recebido:', evento.tipo, 'de', evento.origem)

      return res.status(200).json({ success: true, processado: true, eventoId: evento.id })
    }

    return res.status(400).json({ error: `action inválida: ${action}` })

  } catch (error) {
    console.error('[Bridge Ecosystem] Erro:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
