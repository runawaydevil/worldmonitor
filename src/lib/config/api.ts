/**
 * Configuração de API
 */

import { browser } from '$app/environment';

/**
 * Chave da API Finnhub
 * Obtenha sua chave gratuita em: https://finnhub.io/
 * Tier gratuito: 60 chamadas/minuto
 */
export const FINNHUB_API_KEY = browser
	? (import.meta.env?.VITE_FINNHUB_API_KEY ?? '')
	: (process.env.VITE_FINNHUB_API_KEY ?? '');

export const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Chave da API FRED (St. Louis Fed)
 * Obtenha sua chave gratuita em: https://fred.stlouisfed.org/docs/api/api_key.html
 * Tier gratuito: Requisições ilimitadas
 */
export const FRED_API_KEY = browser
	? (import.meta.env?.VITE_FRED_API_KEY ?? '')
	: (process.env.VITE_FRED_API_KEY ?? '');

export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

/**
 * Domínio da aplicação (para CORS, Vite, etc.)
 * Obtido do .env, padrão: localhost
 */
export const APP_DOMAIN = browser
	? (import.meta.env?.VITE_APP_DOMAIN ?? 'localhost')
	: (process.env.VITE_APP_DOMAIN ?? 'localhost');

/**
 * Verificar se estamos em modo de desenvolvimento
 * Usa import.meta.env que está disponível tanto no browser quanto em ambientes de teste
 */
const isDev = browser ? (import.meta.env?.DEV ?? false) : false;

/**
 * URLs de proxy CORS para requisições de API externas
 * Primário: Cloudflare Worker customizado (mais rápido, dedicado)
 * Fallback: corsproxy.io (público, pode ter rate limit)
 */
export const CORS_PROXIES = {
	primary: 'https://watchman-proxy.seanthielen-e.workers.dev/?url=',
	fallback: 'https://corsproxy.io/?url='
} as const;

// Default export for backward compatibility
export const CORS_PROXY_URL = CORS_PROXIES.fallback;

/**
 * Fetch com fallback de proxy CORS
 * Tenta o proxy primário primeiro, usa o secundário em caso de falha
 */
export async function fetchWithProxy(url: string): Promise<Response> {
	const encodedUrl = encodeURIComponent(url);

	// Try primary proxy first
	try {
		const response = await fetch(CORS_PROXIES.primary + encodedUrl);
		if (response.ok) {
			return response;
		}
		// If we get an error response, try fallback
		logger.warn('API', `Primary proxy failed (${response.status}), trying fallback`);
	} catch (error) {
		logger.warn('API', 'Primary proxy error, trying fallback:', error);
	}

	// Fallback to secondary proxy
	return fetch(CORS_PROXIES.fallback + encodedUrl);
}

/**
 * Atrasos de requisição de API (ms) para evitar rate limiting
 */
export const API_DELAYS = {
	betweenCategories: 500,
	betweenRetries: 1000
} as const;

/**
 * TTLs de cache (ms)
 */
export const CACHE_TTLS = {
	weather: 10 * 60 * 1000, // 10 minutes
	news: 5 * 60 * 1000, // 5 minutes
	markets: 60 * 1000, // 1 minute
	default: 5 * 60 * 1000 // 5 minutes
} as const;

/**
 * Configuração de debug/logging
 */
export const DEBUG = {
	enabled: isDev,
	logApiCalls: isDev,
	logCacheHits: false
} as const;

/**
 * Logger condicional - apenas loga em desenvolvimento
 */
export const logger = {
	log: (prefix: string, ...args: unknown[]) => {
		if (DEBUG.logApiCalls) {
			console.log(`[${prefix}]`, ...args);
		}
	},
	warn: (prefix: string, ...args: unknown[]) => {
		console.warn(`[${prefix}]`, ...args);
	},
	error: (prefix: string, ...args: unknown[]) => {
		console.error(`[${prefix}]`, ...args);
	}
};
