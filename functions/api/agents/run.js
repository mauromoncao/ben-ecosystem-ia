// ============================================================
// BEN ECOSYSTEM IA — agents/run CF Pages Proxy v6.0
// Proxy para VPS Gateway (api.mauromoncao.adv.br)
// Rota: POST /api/agents/run
//
// Roteia para:
//   VPS Agents Server :3188 (35 agentes)
//   via api.mauromoncao.adv.br (API Gateway)
// ============================================================

const VPS_GATEWAY = 'https://api.mauromoncao.adv.br'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ben-Module',
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed', allowed: ['POST'] }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json', 'Allow': 'POST, OPTIONS' },
    })
  }

  try {
    const url = new URL(request.url)
    const target = `${VPS_GATEWAY}/api/agents/run${url.search}`

    const bodyText = await request.text()

    const proxyReq = new Request(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'cf-pages-ecosystem',
        'X-Ben-Module': request.headers.get('X-Ben-Module') || 'ecosystem',
      },
      body: bodyText,
    })

    const vpsRes = await fetch(proxyReq)
    const body = await vpsRes.text()

    return new Response(body, {
      status: vpsRes.status,
      headers: {
        ...CORS,
        'Content-Type': vpsRes.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (err) {
    console.error('[agents/run proxy] Erro:', err)
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
