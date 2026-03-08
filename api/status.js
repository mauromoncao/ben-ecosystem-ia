// ============================================================
// BEN ECOSYSTEM IA — Status/Health Check v2.0
// Rota: GET /api/status
//
// Verifica todos os sistemas do ecossistema:
//   ✓ Ben Growth Center (Vercel)
//   ✓ Ben Juris Center (Vercel)
//   ✓ VPS Hostinger (SQLite Leads - porta 3001)
//   ✓ APIs de IA (Gemini, OpenAI, Claude, Perplexity)
// ============================================================

export const config = { maxDuration: 20 }

const GROWTH_URL = process.env.VITE_GROWTH_API_URL || 'https://ben-growth-center.vercel.app'
const JURIS_URL  = process.env.VITE_JURIS_API_URL  || 'https://ben-juris-center.vercel.app'
const VPS_URL    = process.env.VPS_LEADS_URL        || 'http://181.215.135.202:3001'

async function ping(url, timeoutMs = 5000) {
  const t0 = Date.now()
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    const ms = Date.now() - t0
    return { online: r.ok, ms, status: r.status }
  } catch (e) {
    return { online: false, ms: Date.now() - t0, error: e.message }
  }
}

async function checkModule(baseUrl, name) {
  // Tenta endpoint /api/bridge?action=status primeiro
  const t0 = Date.now()
  try {
    const r = await fetch(`${baseUrl}/api/bridge?action=status`, {
      signal: AbortSignal.timeout(6000),
    })
    const ms = Date.now() - t0
    if (r.ok) {
      const data = await r.json()
      return {
        name,
        status: 'online',
        ms,
        versao: data.versao,
        supabase: data.supabase,
        url: baseUrl,
      }
    }
    return { name, status: 'degraded', ms, url: baseUrl }
  } catch (e) {
    const ms = Date.now() - t0
    return { name, status: 'offline', ms, url: baseUrl, error: e.message }
  }
}

async function checkVPS() {
  const t0 = Date.now()
  try {
    const r = await fetch(`${VPS_URL}/health`, { signal: AbortSignal.timeout(5000) })
    const ms = Date.now() - t0
    if (r.ok) {
      const data = await r.json()
      return {
        name: 'VPS Hostinger',
        status: 'online',
        ms,
        leads: data.leads,
        uptime: data.uptime,
        url: VPS_URL,
      }
    }
    return { name: 'VPS Hostinger', status: 'degraded', ms, url: VPS_URL }
  } catch (e) {
    return { name: 'VPS Hostinger', status: 'offline', ms: Date.now() - t0, url: VPS_URL, error: e.message }
  }
}

function checkApiKeys() {
  const keys = {
    GEMINI:      !!process.env.GEMINI_API_KEY,
    OPENAI:      !!process.env.OPENAI_API_KEY,
    ANTHROPIC:   !!process.env.ANTHROPIC_API_KEY,
    PERPLEXITY:  !!process.env.PERPLEXITY_API_KEY,
    PINECONE:    !!process.env.PINECONE_API_KEY,
    JWT_SECRET:  !!process.env.JWT_SECRET,
    VPS_URL:     !!process.env.VPS_LEADS_URL,
  }
  const configured = Object.values(keys).filter(Boolean).length
  return { keys, configured, total: Object.keys(keys).length }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const t0 = Date.now()

  // Checar todos em paralelo
  const [growth, juris, vps] = await Promise.all([
    checkModule(GROWTH_URL, 'Ben Growth Center'),
    checkModule(JURIS_URL,  'Ben Juris Center'),
    checkVPS(),
  ])

  const apiKeys = checkApiKeys()

  const allOnline   = [growth, juris].every(m => m.status === 'online')
  const vpsOnline   = vps.status === 'online'
  const globalStatus = allOnline ? (vpsOnline ? 'online' : 'parcial') : 'degraded'

  return res.status(200).json({
    success: true,
    ecosystem: 'Ben Ecosystem IA',
    versao: '2.0',
    status: globalStatus,
    timestamp: new Date().toISOString(),
    elapsed_ms: Date.now() - t0,
    modulos: {
      growth,
      juris,
      vps,
    },
    apiKeys,
    urls: {
      growth: GROWTH_URL,
      juris:  JURIS_URL,
      vps:    VPS_URL,
      ecosystem: 'https://ben-ecosystem-ia.vercel.app',
    },
  })
}
