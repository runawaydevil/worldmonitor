/**
 * ServiceClient - Unified fetch client with caching, retries, and circuit breaker
 */

import { CacheManager } from './cache';
import { CircuitBreakerRegistry, type CircuitBreaker } from './circuit-breaker';
import { RequestDeduplicator } from './deduplicator';
import { ServiceRegistry, type ServiceConfig, type ServiceId } from './registry';
import { ServiceError, NetworkError, TimeoutError, CircuitOpenError } from './errors';
import { proxyHealth } from './proxy-health';

export interface RequestOptions {
	params?: Record<string, string | number | boolean>;
	useCache?: boolean;
	retries?: number;
	timeout?: number;
	accept?: string;
	headers?: Record<string, string>;
	fetchOptions?: RequestInit;
	responseType?: 'json' | 'text';
}

export interface RequestResult<T = unknown> {
	data: T;
	fromCache: false | 'memory' | 'storage' | 'fallback' | 'stale-fallback';
	stale?: boolean;
	circuitOpen?: boolean;
	attempt?: number;
	error?: string;
}

export interface ServiceClientOptions {
	debug?: boolean;
}

export interface HealthStatus {
	circuitBreakers: Record<string, ReturnType<CircuitBreaker['getState']>>;
	openCircuits: number;
	inFlightRequests: number;
	cacheStats: ReturnType<CacheManager['getStats']>;
}

export class ServiceClient {
	private readonly cache: CacheManager;
	private readonly circuitBreakers: CircuitBreakerRegistry;
	private readonly deduplicator: RequestDeduplicator;
	private readonly debug: boolean;

	constructor(options: ServiceClientOptions = {}) {
		this.cache = new CacheManager({ prefix: 'sm_', debug: options.debug });
		this.circuitBreakers = new CircuitBreakerRegistry();
		this.deduplicator = new RequestDeduplicator();
		this.debug = options.debug || false;
	}

	/**
	 * Main request method - handles caching, circuit breaker, deduplication
	 */
	async request<T = unknown>(
		serviceId: ServiceId | string,
		endpoint: string,
		options: RequestOptions = {}
	): Promise<RequestResult<T>> {
		const config = ServiceRegistry.get(serviceId);
		if (!config) {
			throw new ServiceError(`Unknown service: ${serviceId}`, serviceId);
		}

		const url = this.buildUrl(config, endpoint, options.params);
		const cacheKey = this.cache.generateKey(url, options.params);

		// 1. Check cache first (unless explicitly disabled)
		if (options.useCache !== false && config.cache) {
			const cached = this.cache.get<T>(cacheKey);
			if (cached && !cached.isStale) {
				return { data: cached.data, fromCache: cached.fromCache, stale: false };
			}
			if (cached && cached.isStale && config.cache.staleWhileRevalidate) {
				// Return stale data immediately, revalidate in background
				this.revalidateInBackground(serviceId, endpoint, options, cacheKey, config);
				return { data: cached.data, fromCache: cached.fromCache, stale: true };
			}
		}

		// 2. Check circuit breaker
		const breaker = this.circuitBreakers.get(serviceId, config.circuitBreaker);
		if (!breaker.canRequest()) {
			// Circuit is open - try to return cached data
			const cached = this.cache.get<T>(cacheKey);
			if (cached) {
				return { data: cached.data, fromCache: 'fallback', circuitOpen: true };
			}
			throw new CircuitOpenError(serviceId);
		}

		// 3. Deduplicate concurrent requests
		return this.deduplicator.dedupe(cacheKey, () =>
			this.executeRequest<T>(serviceId, url, options, cacheKey, breaker, config)
		);
	}

	/**
	 * Execute the actual request with retries
	 */
	private async executeRequest<T>(
		serviceId: string,
		url: string,
		options: RequestOptions,
		cacheKey: string,
		breaker: CircuitBreaker,
		config: ServiceConfig
	): Promise<RequestResult<T>> {
		const retries = options.retries ?? config.retries ?? 2;
		let lastError: Error | undefined;

		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				if (attempt > 0) {
					this.log(`Retry attempt ${attempt} for ${serviceId}`);
				}

				breaker.trackHalfOpenRequest();
				const data = await this.fetchWithTimeout<T>(url, options, config);
				breaker.recordSuccess();

				// Cache successful response
				if (config.cache) {
					this.cache.set(cacheKey, data, config.cache.ttl, config.cache.staleWhileRevalidate);
				}

				return { data, fromCache: false, attempt };
			} catch (error) {
				lastError = error as Error;
				this.log(`Request failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`);

				// Don't retry on certain errors
				if (
					error instanceof CircuitOpenError ||
					(error instanceof NetworkError &&
						(error.status === 404 || error.status === 401 || error.status === 403))
				) {
					break;
				}

				if (attempt < retries) {
					await this.delay(this.getBackoffDelay(attempt));
				}
			}
		}

		breaker.recordFailure();

		// Try returning stale cache on failure
		const cached = this.cache.get<T>(cacheKey);
		if (cached) {
			console.warn(
				`[ServiceClient] ${serviceId}: Retornando cache obsoleto após ${retries + 1} tentativas falhadas`
			);
			return { data: cached.data, fromCache: 'stale-fallback', error: lastError?.message };
		}

		throw lastError;
	}

	/**
	 * Fetch with AbortController timeout
	 */
	private async fetchWithTimeout<T>(
		url: string,
		options: RequestOptions,
		config: ServiceConfig
	): Promise<T> {
		const controller = new AbortController();
		const timeout = options.timeout || config.timeout || 10000;
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const fetchOptions: RequestInit = {
				...options.fetchOptions,
				signal: controller.signal,
				headers: {
					Accept: options.accept || 'application/json',
					...options.headers
				}
			};

			const response = await fetch(url, fetchOptions);

			if (!response.ok) {
				throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status);
			}

			// Handle different response types
			const contentType = response.headers.get('content-type') || '';
			if (
				options.responseType === 'text' ||
				contentType.includes('text/') ||
				contentType.includes('xml')
			) {
				return (await response.text()) as T;
			}
			return (await response.json()) as T;
		} catch (error) {
			if ((error as Error).name === 'AbortError') {
				throw new TimeoutError(url, timeout);
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Build URL from config and endpoint
	 */
	private buildUrl(
		config: ServiceConfig,
		endpoint: string,
		params: Record<string, string | number | boolean> = {}
	): string {
		let baseUrl = config.baseUrl || '';

		// Handle full URLs (for CORS proxy passthrough)
		if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
			baseUrl = '';
		}

		const fullUrl = baseUrl + endpoint;
		const url = new URL(fullUrl);

		// Add query params
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});

		return url.toString();
	}

	/**
	 * Calculate exponential backoff delay with jitter
	 * Improved: starts with smaller delays, caps at reasonable max
	 */
	private getBackoffDelay(attempt: number): number {
		// Base: 500ms, 1s, 2s, 4s... + random 0-300ms jitter
		// Start with smaller delay for first retry
		const baseDelay = attempt === 0 ? 500 : Math.pow(2, attempt - 1) * 1000;
		const jitter = Math.random() * 300;
		return Math.min(baseDelay + jitter, 8000); // Max 8 seconds (reduced from 10s)
	}

	/**
	 * Delay helper
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Revalidate in background (fire and forget)
	 */
	private revalidateInBackground(
		serviceId: ServiceId | string,
		endpoint: string,
		options: RequestOptions,
		cacheKey: string,
		config: ServiceConfig
	): void {
		const breaker = this.circuitBreakers.get(serviceId, config.circuitBreaker);
		const url = this.buildUrl(config, endpoint, options.params);

		this.executeRequest(serviceId, url, { ...options, useCache: false }, cacheKey, breaker, config)
			.then(() => this.log(`Background revalidation complete: ${serviceId}`))
			.catch(() => this.log(`Background revalidation failed: ${serviceId}`));
	}

	/**
	 * Fetch through CORS proxy with fallback
	 */
	async fetchWithProxy<T = string>(targetUrl: string, options: RequestOptions = {}): Promise<T> {
		const allProxies = ServiceRegistry.getCorsProxies();
		const config = ServiceRegistry.get('CORS_PROXY');
		if (!config) {
			throw new ServiceError('CORS_PROXY service not configured');
		}

		// Reset old health data periodically
		proxyHealth.resetOldHealth();

		// Sort proxies by health (healthiest first)
		const proxies = proxyHealth.getSortedProxies(allProxies);

		let lastError: Error | undefined;
		let timeoutCount = 0;

		for (let i = 0; i < proxies.length; i++) {
			const proxy = proxies[i];
			const proxyUrl = proxy + encodeURIComponent(targetUrl);

			// Small delay between proxy attempts (except first)
			if (i > 0) {
				await this.delay(200 + Math.random() * 100); // 200-300ms delay
			}

			try {
				// Use fetch directly to check status before processing
				const controller = new AbortController();
				const timeout = options.timeout || config.timeout || 15000;
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				try {
					const fetchOptions: RequestInit = {
						...options.fetchOptions,
						signal: controller.signal,
						headers: {
							Accept: options.accept || 'application/rss+xml, application/xml, text/xml, */*',
							...options.headers
						}
					};

					const response = await fetch(proxyUrl, fetchOptions);

					// 408 (Request Timeout) é esperado em proxies públicos - tentar próximo proxy silenciosamente
					if (response.status === 408) {
						timeoutCount++;
						proxyHealth.recordFailure(proxyUrl);
						lastError = new NetworkError(`Proxy timeout (408)`, 408);
						clearTimeout(timeoutId);
						continue;
					}

					if (!response.ok) {
						proxyHealth.recordFailure(proxyUrl);
						lastError = new NetworkError(`HTTP ${response.status}: ${response.statusText}`, response.status);
						clearTimeout(timeoutId);
						continue;
					}

					clearTimeout(timeoutId);

					// Get response text
					const text = await response.text();
					const trimmedText = text.trim();

					// Validate response (check for error pages, HTML, or invalid formats)
					// Skip if it's HTML, error pages, or empty
					if (
						!trimmedText ||
						trimmedText.startsWith('<!DOCTYPE') ||
						trimmedText.startsWith('<html') ||
						trimmedText.startsWith('<HTML') ||
						trimmedText.includes('error code:') ||
						trimmedText.includes('Error:') ||
						trimmedText.includes('ERROR:') ||
						(trimmedText.startsWith('<') && trimmedText.includes('</'))
					) {
					// Invalid response - try next proxy
					proxyHealth.recordFailure(proxyUrl);
					lastError = new Error('Invalid response format (HTML or error page)');
					continue;
					}

					// Check if it looks like JSON (starts with { or [)
					// For text/plain responses that might be JSON, try to parse
					const contentType = response.headers.get('content-type') || '';
					if (contentType.includes('text/plain') && (trimmedText.startsWith('{') || trimmedText.startsWith('['))) {
						// Might be JSON wrapped in text/plain - return it
						return text as T;
					}

					// Valid response - record success
					proxyHealth.recordSuccess(proxyUrl);
					return text as T;
				} catch (error) {
					clearTimeout(timeoutId);
					if ((error as Error).name === 'AbortError') {
						timeoutCount++;
						proxyHealth.recordFailure(proxyUrl);
						lastError = new TimeoutError(proxyUrl, timeout);
						continue;
					}
					proxyHealth.recordFailure(proxyUrl);
					lastError = error as Error;
				}
			} catch (e) {
				// Only log if not a timeout (408) or if in dev mode
				if (!(e instanceof NetworkError && e.status === 408) && !(e instanceof TimeoutError)) {
					this.log(`Proxy ${i + 1} failed: ${(e as Error).message}`);
				}
				lastError = e as Error;
			}
		}

		// Only throw if all proxies failed
		throw lastError || new NetworkError('All CORS proxies failed');
	}

	/**
	 * Get health status of all services
	 */
	getHealthStatus(): HealthStatus {
		return {
			circuitBreakers: this.circuitBreakers.getStatus(),
			openCircuits: this.circuitBreakers.getOpenCount(),
			inFlightRequests: this.deduplicator.getCount(),
			cacheStats: this.cache.getStats()
		};
	}

	/**
	 * Clear cache for a specific service pattern
	 */
	clearServiceCache(pattern: string): void {
		this.cache.invalidate(pattern);
	}

	/**
	 * Reset all circuit breakers
	 */
	resetCircuitBreakers(): void {
		this.circuitBreakers.resetAll();
	}

	/**
	 * Debug logging
	 */
	private log(message: string): void {
		if (this.debug) {
			console.log(`[ServiceClient] ${message}`);
		}
	}
}

// Export singleton instance
export const serviceClient = new ServiceClient({ debug: false });
