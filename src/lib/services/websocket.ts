/**
 * Cliente WebSocket para updates em tempo real
 * Por enquanto, implementação básica que pode ser conectada a um servidor futuro
 */

export interface WebSocketMessage {
	type: string;
	data: any;
	timestamp: number;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketOptions {
	url?: string;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
	onMessage?: (message: WebSocketMessage) => void;
	onStatusChange?: (status: WebSocketStatus) => void;
}

export class WebSocketClient {
	private ws: WebSocket | null = null;
	private url: string;
	private reconnectInterval: number;
	private maxReconnectAttempts: number;
	private reconnectAttempts = 0;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private onMessage?: (message: WebSocketMessage) => void;
	private onStatusChange?: (status: WebSocketStatus) => void;
	private _status: WebSocketStatus = 'disconnected';

	constructor(options: WebSocketOptions = {}) {
		this.url = options.url || 'ws://localhost:8080';
		this.reconnectInterval = options.reconnectInterval || 3000;
		this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
		this.onMessage = options.onMessage;
		this.onStatusChange = options.onStatusChange;
	}

	get status(): WebSocketStatus {
		return this._status;
	}

	/**
	 * Conectar ao servidor WebSocket
	 */
	connect(): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return;
		}

		this.updateStatus('connecting');

		try {
			this.ws = new WebSocket(this.url);

			this.ws.onopen = () => {
				this.reconnectAttempts = 0;
				this.updateStatus('connected');
				console.log('[WebSocket] Conectado');
			};

			this.ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					if (this.onMessage) {
						this.onMessage(message);
					}
				} catch (error) {
					console.error('[WebSocket] Erro ao processar mensagem:', error);
				}
			};

			this.ws.onerror = (error) => {
				console.error('[WebSocket] Erro:', error);
				this.updateStatus('error');
			};

			this.ws.onclose = () => {
				this.updateStatus('disconnected');
				this.attemptReconnect();
			};
		} catch (error) {
			console.error('[WebSocket] Erro ao conectar:', error);
			this.updateStatus('error');
			this.attemptReconnect();
		}
	}

	/**
	 * Desconectar do servidor
	 */
	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}

		this.updateStatus('disconnected');
	}

	/**
	 * Enviar mensagem
	 */
	send(type: string, data: any): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			const message: WebSocketMessage = {
				type,
				data,
				timestamp: Date.now()
			};
			this.ws.send(JSON.stringify(message));
		} else {
			console.warn('[WebSocket] Não conectado, mensagem não enviada');
		}
	}

	/**
	 * Tentar reconectar
	 */
	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error('[WebSocket] Máximo de tentativas de reconexão atingido');
			return;
		}

		this.reconnectAttempts++;
		this.reconnectTimer = setTimeout(() => {
			console.log(`[WebSocket] Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
			this.connect();
		}, this.reconnectInterval);
	}

	/**
	 * Atualizar status e notificar listeners
	 */
	private updateStatus(status: WebSocketStatus): void {
		this._status = status;
		if (this.onStatusChange) {
			this.onStatusChange(status);
		}
	}
}

// Singleton instance (não conecta automaticamente)
export const websocketClient = new WebSocketClient({
	// URL será configurada quando houver servidor
	// Por enquanto, não conecta automaticamente
	onStatusChange: (status) => {
		console.log('[WebSocket] Status:', status);
	}
});
