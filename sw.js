// Cache do aplicativo Rotina para funcionamento offline e atualização em segundo plano
const CACHE_NAME = 'rotina-cache-v1';
const ARQUIVOS_BASE = [
  './',
  './index.html',
  './manifest.webmanifest'
];

// Pré-carrega os arquivos principais na instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_BASE))
  );
  self.skipWaiting();
});

// Remove versões antigas do cache quando o Service Worker é atualizado
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

// Responde priorizando o cache e atualiza o cache quando houver rede
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((respostaCache) => {
      const buscaRede = fetch(event.request)
        .then((respostaRede) => {
          if (respostaRede && respostaRede.status === 200 && respostaRede.type === 'basic') {
            const copia = respostaRede.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respostaRede;
        })
        .catch(() => respostaCache);

      return respostaCache || buscaRede;
    })
  );
});