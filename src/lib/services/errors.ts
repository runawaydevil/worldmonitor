/**
 * Classes de erro customizadas para camada de serviços
 */

export class ServiceError extends Error {
	readonly serviceId: string | null;

	constructor(message: string, serviceId: string | null = null) {
		super(message);
		this.name = 'ServiceError';
		this.serviceId = serviceId;
	}
}

export class NetworkError extends Error {
	readonly status: number | null;

	constructor(message: string, status: number | null = null) {
		super(message);
		this.name = 'NetworkError';
		this.status = status;
	}
}

export class TimeoutError extends Error {
	readonly url: string;
	readonly timeout: number | null;

	constructor(url: string, timeout: number | null = null) {
		super(`Requisição expirou: ${url}`);
		this.name = 'TimeoutError';
		this.url = url;
		this.timeout = timeout;
	}
}

export class CircuitOpenError extends Error {
	readonly serviceId: string;

	constructor(serviceId: string) {
		super(`Circuit breaker aberto para serviço: ${serviceId}`);
		this.name = 'CircuitOpenError';
		this.serviceId = serviceId;
	}
}
