// BEN Ecosystem IA — Service Worker v3.0
// BUILD: 2026-03-12T00:00:00Z
// ESTRATÉGIA: network-first para HTML/index, cache-first para assets hashed (JS/CSS/img)
// CACHE v4 invalida o v3/v2/v1 automaticamente no activate

const CACHE_NAME = 'ben-ecosystem-v4'

// Assets com hash no nome (Vite): sempre cache-first após 1ª carga (imutáveis)
const isHashedAsset = url =>
  /\/assets\/[^/]+-[A-Za-z0-9]{8}\.(js|css|woff2?|png|svg|ico)$/.test(url.pathname)

// HTML navigation routes: sempre network-first
const isNavigationRequest = req =>
  req.mode === 'navigate' || req.destination === 'document'

// ─── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW v3.0] Installing — cache: ' + CACHE_NAME)
  // Ativa imediatamente sem esperar fechar abas antigas
  self.skipWaiting()
})

// ─── Activate: apaga TODOS os caches antigos ─────────────────
self.addEventListener('activate', event => {
  console.log('[SW v3.0] Activating — clearing old caches')
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW v3.0] Removendo cache antigo:', k)
        return caches.delete(k)
      }))
    ).then(() => {
      console.log('[SW v3.0] Old caches cleared — claiming clients')
      // Assume controle imediato de TODAS as abas abertas
      return self.clients.claim()
    }).then(() => {
      // Notifica todos os clientes para recarregar a página
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: '3.0', cache: CACHE_NAME })
        })
      })
    })
  )
})

// ─── Fetch ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // 1. API calls: SEMPRE network, nunca cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // 2. index.html / rotas de navegação: SEMPRE network-first
  //    Garante que o browser sempre carrega o HTML mais recente
  if (isNavigationRequest(event.request) || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // 3. Assets com hash (JS/CSS Vite): cache-first — são imutáveis pelo hash
  if (isHashedAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // 4. Demais assets (imagens, manifest, icons): network-first com fallback cache
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})

// ─── postMessage: suporte a skipWaiting sob demanda ──────────
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
