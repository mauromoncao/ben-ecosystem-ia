// ============================================================
// BEN ECOSYSTEM IA — Status/Health Check v2.1
// Rota: GET /api/status
// ============================================================

export const config = { maxDuration: 20 }

const GROWTH_URL = (process.env.VITE_GROWTH_API_URL || 'https://ben-growth-center.vercel.app').trim()
const JURIS_URL  = (process.env.VITE_JURIS_API_URL  || 'https://ben-juris-center.vercel.app').trim()
const VPS_URL    = (process.env.VPS_LEADS_URL        || 'http://181.215.135.202:3001').trim()

async function checkModule(baseUrl, name) {
  const t0 = Date.now()
  try {
    const r = await fetch(`${baseUrl}/api/bridge?action=status`, { signal: AbortSignal.timeout(6000) })
    const ms = Date.now() - t0
    if (r.ok) {
      const data = await r.json()
      return { name, status: 'online', ms, versao: data.versao, url: baseUrl }
    }
    return { name, status: 'degraded', ms, url: baseUrl }
  } catch (e) {
    return { name, status: 'offline', ms: Date.now() - t0, url: baseUrl, error: e.message }
  }
}

async function checkVPS() {
  const t0 = Date.now()
  try {
    const r = await fetch(`${VPS_URL}/health`, { signal: AbortSignal.timeout(5000) })
    const ms = Date.now() - t0
    if (r.ok) {
      const data = await r.json()
      return { name: 'VPS Hostinger', status: 'online', ms, leads: data.leads, uptime: data.uptime, url: VPS_URL }
    }
    return { name: 'VPS Hostinger', status: 'degraded', ms, url: VPS_URL }
  } catch (e) {
    return { name: 'VPS Hostinger', status: 'offline', ms: Date.now() - t0, url: VPS_URL, error: e.message }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const t0 = Date.now()
  const [growth, juris, vps] = await Promise.all([
    checkModule(GROWTH_URL, 'Ben Growth Center'),
    checkModule(JURIS_URL, 'Ben Juris Center'),
    checkVPS(),
  ])

  const allOnline = [growth, juris].every(m => m.status === 'online')
  const vpsOnline = vps.status === 'online'

  return res.status(200).json({
    success: true,
    ecosystem: 'Ben Ecosystem IA',
    versao: '2.1',
    stack: 'Claude Haiku 4.5 · GPT-4o · GPT-4o-mini · Perplexity',
    status: allOnline ? (vpsOnline ? 'online' : 'parcial') : 'degraded',
    timestamp: new Date().toISOString(),
    elapsed_ms: Date.now() - t0,
    modulos: { growth, juris, vps },
    agentes: {
      growth: { total: 9, modelos: ['gpt-4o-mini','gpt-4o','claude-haiku-4-5'] },
      juris:  { total: 15, modelos: ['claude-haiku-4-5','gpt-4o','perplexity'], extras: ['dr-ben-engenheiro'] },
    },
    urls: {
      growth: GROWTH_URL,
      juris: JURIS_URL,
      vps: VPS_URL,
      ecosystem: 'https://ben-ecosystem-ia.vercel.app',
    },
  })
}
