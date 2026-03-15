// ============================================================
// BEN ECOSYSTEM IA — status CF Pages Proxy
// Proxy para VPS Gateway (api.mauromoncao.adv.br)
// Rota: GET /api/status
// ============================================================

const VPS_GATEWAY = 'https://api.mauromoncao.adv.br'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS })
  }

  try {
    const url = new URL(request.url)
    const target = `${VPS_GATEWAY}/api/status${url.search}`

    const vpsRes = await fetch(target, {
      headers: { 'X-Forwarded-From': 'cf-pages-ecosystem' },
    })
    const body = await vpsRes.text()

    return new Response(body, {
      status: vpsRes.status,
      headers: {
        ...CORS,
        'Content-Type': vpsRes.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message), proxy: 'status' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
}
