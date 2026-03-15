// ============================================================
// BEN ECOSYSTEM IA — upload CF Pages Proxy
// Proxy para VPS Gateway (api.mauromoncao.adv.br)
// Rota: POST /api/upload
// ============================================================

const VPS_GATEWAY = 'https://api.mauromoncao.adv.br'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function onRequest(context) {
  const { request } = context

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS })
  }

  try {
    const url = new URL(request.url)
    const target = `${VPS_GATEWAY}/api/upload${url.search}`

    // Forward the full request including multipart body
    const proxyReq = new Request(target, {
      method: request.method,
      headers: request.headers,
      body: await request.arrayBuffer(),
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
    return new Response(JSON.stringify({ error: String(err.message), proxy: 'upload' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
}
