// ============================================================
// BEN ECOSYSTEM IA — Proxy Upload → Juris Center Parser
// Rota: POST /api/upload
// Proxies para: ben-juris-center.vercel.app/api/upload
// ============================================================

export const config = {
  maxDuration: 120,
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

const JURIS_URL = process.env.JURIS_API_URL || 'https://ben-juris-center.vercel.app'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  try {
    const upstream = await fetch(`${JURIS_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ecosystem-source': 'ben-ecosystem-ia',
      },
      body: JSON.stringify(req.body),
    })

    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch (err) {
    console.error('[UPLOAD PROXY]', err)
    return res.status(502).json({ success: false, error: 'Proxy para Juris Center falhou', detail: err.message })
  }
}
