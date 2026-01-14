/**
 * Service Worker para suporte offline do Watchman
 */

/// <reference lib="webworker" />
/// <reference path="./service-worker.d.ts" />

const VERSION = '0.01';
const CACHE_NAME = `watchman-v${VERSION}`;
const STATIC_CACHE = `watchman-static-v${VERSION}`;
const DATA_CACHE = `watchman-data-v${VERSION}`;

// Assets estáticos para cache
const STATIC_ASSETS = [
	'/',
	'/favicon.ico'
];

// Estratégia: Cache-first para assets estáticos
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	
	if (cached) {
		return cached;
	}
	
	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		// Se offline e não tem cache, retornar página offline
		if (request.destination === 'document') {
			return new Response('Offline', { status: 503 });
		}
		throw error;
	}
}

// Estratégia: Network-first para dados dinâmicos
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	
	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}
		throw error;
	}
}

// Estratégia: Stale-while-revalidate para notícias
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	
	// Retornar cache imediatamente se disponível
	const fetchPromise = fetch(request).then((response) => {
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	});
	
	return cached || fetchPromise;
}

// Install event - cache assets estáticos
self.addEventListener('install', (event) => {
	const evt = event as ExtendableEvent;
	evt.waitUntil(
		caches.open(STATIC_CACHE).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		})
	);
	(self as unknown as ServiceWorkerGlobalScope).skipWaiting();
});

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
	const evt = event as ExtendableEvent;
	evt.waitUntil(
		caches.keys().then((cacheNames) => {
			const oldCaches = cacheNames.filter((name) => {
				// Deletar todos os caches que não correspondem à versão atual
				return !name.includes(`v${VERSION}`) && name.startsWith('watchman-');
			});

			if (oldCaches.length > 0) {
				// Logar apenas resumo (reduzir verbosidade)
				// Em produção, logar apenas se houver muitos caches
				if (oldCaches.length > 1) {
					console.log(`[Service Worker] Deletando ${oldCaches.length} caches antigos`);
				}
			}

			return Promise.all(oldCaches.map((name) => caches.delete(name)));
		}).then(() => {
			// Logar apenas resumo (reduzir verbosidade)
			// Remover log de ativação em produção
			return (self as unknown as ServiceWorkerGlobalScope).clients.claim();
		}).catch((error) => {
			console.error('[Service Worker] Erro ao ativar:', error);
		})
	);
});

// Fetch event - estratégias de cache
self.addEventListener('fetch', (event: FetchEvent) => {
	const { request } = event;
	const url = new URL(request.url);
	
	// Ignorar requests não-GET
	if (request.method !== 'GET') {
		return;
	}
	
	// Ignorar chrome-extension e outros protocolos
	if (!url.protocol.startsWith('http')) {
		return;
	}
	
	// Assets estáticos: cache-first
	if (
		url.pathname.endsWith('.js') ||
		url.pathname.endsWith('.css') ||
		url.pathname.endsWith('.woff') ||
		url.pathname.endsWith('.woff2') ||
		url.pathname.endsWith('.png') ||
		url.pathname.endsWith('.jpg') ||
		url.pathname.endsWith('.svg')
	) {
		event.respondWith(cacheFirst(request, STATIC_CACHE));
		return;
	}
	
	// Dados de API: network-first ou stale-while-revalidate
	if (url.pathname.includes('/api/') || url.searchParams.has('url')) {
		// Para notícias, usar stale-while-revalidate
		if (url.pathname.includes('news') || url.pathname.includes('gdelt')) {
			event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
		} else {
			// Para outros dados, usar network-first
			event.respondWith(networkFirst(request, DATA_CACHE));
		}
		return;
	}
	
	// Páginas HTML: network-first
	if (request.destination === 'document') {
		event.respondWith(networkFirst(request, STATIC_CACHE));
		return;
	}
	
	// Default: tentar network, fallback para cache
	event.respondWith(networkFirst(request, CACHE_NAME));
});
