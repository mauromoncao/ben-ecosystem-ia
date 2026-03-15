// ============================================================
// BEN ECOSYSTEM IA — leads CF Pages Proxy
// Proxy para VPS Gateway (api.mauromoncao.adv.br)
// Rota: GET|POST|PATCH /api/leads
// ============================================================

const VPS_GATEWAY = 'https://api.mauromoncao.adv.br'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS })
  }

  try {
    const url = new URL(request.url)
    const target = `${VPS_GATEWAY}/api/leads${url.search}`

    const proxyReq = new Request(target, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-From': 'cf-pages-ecosystem',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? await request.text()
        : undefined,
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
    return new Response(JSON.stringify({ error: String(err.message), proxy: 'leads' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
}
