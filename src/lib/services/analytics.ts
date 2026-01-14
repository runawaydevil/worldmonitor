/**
 * Serviço de Analytics para tracking de uso
 * Respeita Do Not Track e privacidade do usuário
 */

export interface AnalyticsEvent {
	name: string;
	category?: string;
	label?: string;
	value?: number;
	[key: string]: any;
}

class AnalyticsService {
	private enabled = false;
	private events: AnalyticsEvent[] = [];

	constructor() {
		// Verificar Do Not Track
		if (typeof navigator !== 'undefined') {
			const dnt = navigator.doNotTrack || (window as any).doNotTrack;
			if (dnt === '1' || dnt === 'yes') {
				console.log('[Analytics] Do Not Track ativado, analytics desabilitado');
				return;
			}
		}

		// Por enquanto, apenas coleta eventos localmente
		// Pode ser integrado com Google Analytics, Plausible, etc. no futuro
		this.enabled = true;
	}

	/**
	 * Rastrear evento
	 */
	track(event: AnalyticsEvent): void {
		if (!this.enabled) return;

		const eventWithTimestamp = {
			...event,
			timestamp: Date.now()
		};

		this.events.push(eventWithTimestamp);

		// Limitar histórico a 100 eventos
		if (this.events.length > 100) {
			this.events.shift();
		}

		// Log em desenvolvimento
		if (import.meta.env.DEV) {
			console.log('[Analytics]', event);
		}
	}

	/**
	 * Rastrear visualização de painel
	 */
	trackPanelView(panelId: string): void {
		this.track({
			name: 'panel_view',
			category: 'engagement',
			label: panelId
		});
	}

	/**
	 * Rastrear interação
	 */
	trackInteraction(action: string, target: string): void {
		this.track({
			name: 'interaction',
			category: 'engagement',
			label: `${action}_${target}`
		});
	}

	/**
	 * Rastrear refresh
	 */
	trackRefresh(type: 'manual' | 'auto'): void {
		this.track({
			name: 'refresh',
			category: 'data',
			label: type
		});
	}

	/**
	 * Rastrear erro
	 */
	trackError(error: string, context?: string): void {
		this.track({
			name: 'error',
			category: 'error',
			label: error,
			context
		});
	}

	/**
	 * Rastrear tempo de carregamento
	 */
	trackLoadTime(duration: number, resource: string): void {
		this.track({
			name: 'load_time',
			category: 'performance',
			label: resource,
			value: duration
		});
	}

	/**
	 * Obter eventos coletados (útil para debug)
	 */
	getEvents(): AnalyticsEvent[] {
		return [...this.events];
	}

	/**
	 * Limpar eventos
	 */
	clearEvents(): void {
		this.events = [];
	}
}

export const analytics = new AnalyticsService();
