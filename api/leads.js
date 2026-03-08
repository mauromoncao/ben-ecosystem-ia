// ============================================================
// BEN ECOSYSTEM IA — Leads Proxy (VPS Hostinger)
// Rota: GET|POST|PATCH /api/leads
//
// Proxy direto para VPS Hostinger (SQLite via porta 3001)
// URL VPS: http://181.215.135.202:3001
// ============================================================

export const config = { maxDuration: 15 }

const VPS_URL = process.env.VPS_LEADS_URL || 'http://181.215.135.202:3001'

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function vpsRequest(path, method = 'GET', body = null, timeoutMs = 8000) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    }
    if (body) opts.body = JSON.stringify(body)
    const res  = await fetch(`${VPS_URL}${path}`, opts)
    const data = await res.json()
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    return { ok: false, error: e.message, data: null }
  }
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  const body   = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const pathId = req.query.id

  try {
    // GET /api/leads — listar todos
    if (req.method === 'GET' && !pathId) {
      const r = await vpsRequest('/leads')
      if (r.ok) return res.status(200).json({ ...r.data, fonte: 'vps' })
      return res.status(200).json({ ok: false, total: 0, leads: [], erro: r.error, fonte: 'vps-offline' })
    }

    // POST /api/leads — criar/atualizar lead
    if (req.method === 'POST' && !req.url?.includes('/mensagem')) {
      const r = await vpsRequest('/leads', 'POST', body)
      if (r.ok) return res.status(r.status || 201).json(r.data)
      return res.status(503).json({ ok: false, error: 'VPS indisponível', details: r.error })
    }

    // POST /api/leads/mensagem — registrar mensagem
    if (req.method === 'POST' && req.url?.includes('/mensagem')) {
      const r = await vpsRequest('/leads/mensagem', 'POST', body)
      if (r.ok) return res.status(200).json(r.data)
      return res.status(503).json({ ok: false, error: 'VPS indisponível', details: r.error })
    }

    // PATCH /api/leads/:id — atualizar lead
    if (req.method === 'PATCH' && pathId) {
      const r = await vpsRequest(`/leads/${pathId}`, 'PATCH', body)
      if (r.ok) return res.status(200).json(r.data)
      return res.status(r.status || 503).json({ ok: false, error: r.error })
    }

    // DELETE /api/leads/:id — remover lead
    if (req.method === 'DELETE' && pathId) {
      const r = await vpsRequest(`/leads/${pathId}`, 'DELETE')
      if (r.ok) return res.status(200).json(r.data)
      return res.status(r.status || 503).json({ ok: false, error: r.error })
    }

    return res.status(404).json({ error: 'Rota não encontrada' })

  } catch (error) {
    console.error('[Leads Proxy] Erro:', error)
    return res.status(500).json({ ok: false, error: error.message })
  }
}
