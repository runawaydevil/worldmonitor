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
 * Lista de proxies em ordem de preferência
 */
export const CORS_PROXIES = {
	primary: 'https://corsproxy.io/?url=',
	fallback: 'https://api.allorigins.win/raw?url=',
	alternatives: [
		'https://allorigins.win/get?url=',
		'https://api.codetabs.com/v1/proxy?quest='
	]
} as const;

// Default export for backward compatibility
export const CORS_PROXY_URL = CORS_PROXIES.fallback;

/**
 * Fetch com fallback de proxy CORS
 * Tenta proxies em ordem até encontrar um que funcione
 */
export async function fetchWithProxy(url: string): Promise<Response> {
	const encodedUrl = encodeURIComponent(url);
	const allProxies = [
		CORS_PROXIES.primary,
		CORS_PROXIES.fallback,
		...CORS_PROXIES.alternatives
	];

	let lastError: Error | null = null;

	for (const proxy of allProxies) {
		try {
			const response = await fetch(proxy + encodedUrl);
			if (response.ok) {
				return response;
			}
			// 408 (Request Timeout) é esperado em proxies públicos - não logar como erro
			if (response.status === 408) {
				lastError = new Error(`Proxy timeout: ${proxy}`);
				continue;
			}
			// Outros erros HTTP - tentar próximo proxy
			lastError = new Error(`Proxy failed with status ${response.status}: ${proxy}`);
		} catch (error) {
			lastError = error as Error;
		}
	}

	// Se todos os proxies falharam, lançar erro
	throw lastError || new Error('All CORS proxies failed');
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
	logCacheHits: false,
	logProxyFallbacks: false // Reduzir verbosidade de fallbacks de proxy
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
		// Para fallbacks de proxy, verificar flag específica
		if (prefix === 'API' && args[0]?.toString().includes('proxy') && !DEBUG.logProxyFallbacks) {
			return;
		}
		console.warn(`[${prefix}]`, ...args);
	},
	error: (prefix: string, ...args: unknown[]) => {
		// Erros sempre são logados
		console.error(`[${prefix}]`, ...args);
	}
};
