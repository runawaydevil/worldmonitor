/**
 * Proxy Health Check - Tracks proxy performance and rotates based on health
 */

interface ProxyHealth {
	url: string;
	successCount: number;
	failureCount: number;
	lastSuccess: number | null;
	lastFailure: number | null;
	isHealthy: boolean;
}

class ProxyHealthManager {
	private health: Map<string, ProxyHealth> = new Map();
	private readonly HEALTH_THRESHOLD = 0.3; // Consider unhealthy if failure rate > 30%
	private readonly MIN_REQUESTS = 3; // Need at least 3 requests to judge health
	private readonly HEALTH_RESET_TIME = 5 * 60 * 1000; // Reset health after 5 minutes

	/**
	 * Record a successful request
	 */
	recordSuccess(proxyUrl: string): void {
		const health = this.getOrCreate(proxyUrl);
		health.successCount++;
		health.lastSuccess = Date.now();
		this.updateHealthStatus(health);
	}

	/**
	 * Record a failed request
	 */
	recordFailure(proxyUrl: string): void {
		const health = this.getOrCreate(proxyUrl);
		health.failureCount++;
		health.lastFailure = Date.now();
		this.updateHealthStatus(health);
	}

	/**
	 * Get health status for a proxy
	 */
	getHealth(proxyUrl: string): ProxyHealth {
		return this.getOrCreate(proxyUrl);
	}

	/**
	 * Get proxies sorted by health (healthiest first)
	 */
	getSortedProxies(proxies: string[]): string[] {
		return [...proxies].sort((a, b) => {
			const healthA = this.getHealth(a);
			const healthB = this.getHealth(b);

			// Healthy proxies first
			if (healthA.isHealthy && !healthB.isHealthy) return -1;
			if (!healthA.isHealthy && healthB.isHealthy) return 1;

			// Then by success rate
			const rateA = this.getSuccessRate(healthA);
			const rateB = this.getSuccessRate(healthB);
			return rateB - rateA;
		});
	}

	/**
	 * Reset health data (call periodically to allow recovery)
	 */
	resetOldHealth(): void {
		const now = Date.now();
		for (const health of this.health.values()) {
			// Reset if last activity was more than HEALTH_RESET_TIME ago
			const lastActivity = Math.max(
				health.lastSuccess || 0,
				health.lastFailure || 0
			);
			if (now - lastActivity > this.HEALTH_RESET_TIME) {
				health.successCount = 0;
				health.failureCount = 0;
				health.isHealthy = true;
			}
		}
	}

	private getOrCreate(proxyUrl: string): ProxyHealth {
		if (!this.health.has(proxyUrl)) {
			this.health.set(proxyUrl, {
				url: proxyUrl,
				successCount: 0,
				failureCount: 0,
				lastSuccess: null,
				lastFailure: null,
				isHealthy: true
			});
		}
		return this.health.get(proxyUrl)!;
	}

	private updateHealthStatus(health: ProxyHealth): void {
		const total = health.successCount + health.failureCount;
		if (total < this.MIN_REQUESTS) {
			// Not enough data - assume healthy
			health.isHealthy = true;
			return;
		}

		const failureRate = health.failureCount / total;
		health.isHealthy = failureRate <= this.HEALTH_THRESHOLD;
	}

	private getSuccessRate(health: ProxyHealth): number {
		const total = health.successCount + health.failureCount;
		if (total === 0) return 1; // No data = assume good
		return health.successCount / total;
	}
}

export const proxyHealth = new ProxyHealthManager();
