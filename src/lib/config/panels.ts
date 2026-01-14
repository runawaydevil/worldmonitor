/**
 * Configuração de painéis
 */

export interface PanelConfig {
	name: string;
	priority: 1 | 2 | 3;
}

export type PanelId =
	| 'map'
	| 'youtube'
	| 'politics'
	| 'tech'
	| 'finance'
	| 'gov'
	| 'heatmap'
	| 'markets'
	| 'monitors'
	| 'commodities'
	| 'crypto'
	| 'polymarket'
	| 'mainchar'
	| 'printer'
	| 'contracts'
	| 'ai'
	| 'layoffs'
	| 'venezuela'
	| 'greenland'
	| 'iran'
	| 'leaders'
	| 'intel'
	| 'correlation'
	| 'narrative'
	| 'fed';

export const PANELS: Record<PanelId, PanelConfig> = {
	map: { name: 'Mapa Global', priority: 1 },
	youtube: { name: 'Notícias 24h', priority: 2 },
	politics: { name: 'Mundo / Geopolítica', priority: 1 },
	tech: { name: 'Tecnologia / IA', priority: 1 },
	finance: { name: 'Financeiro', priority: 1 },
	gov: { name: 'Governo / Política', priority: 2 },
	heatmap: { name: 'Mapa de Calor de Setores', priority: 1 },
	markets: { name: 'Mercados', priority: 1 },
	monitors: { name: 'Meus Monitores', priority: 1 },
	commodities: { name: 'Commodities / VIX', priority: 2 },
	crypto: { name: 'Criptomoedas', priority: 2 },
	polymarket: { name: 'Polymarket', priority: 2 },
	mainchar: { name: 'Personagem Principal', priority: 2 },
	printer: { name: 'Impressora de Dinheiro', priority: 2 },
	contracts: { name: 'Contratos Gov', priority: 3 },
	ai: { name: 'Corrida Armamentista de IA', priority: 3 },
	layoffs: { name: 'Rastreador de Demissões', priority: 3 },
	venezuela: { name: 'Situação Venezuela', priority: 2 },
	greenland: { name: 'Situação Groenlândia', priority: 2 },
	iran: { name: 'Situação Irã', priority: 2 },
	leaders: { name: 'Líderes Mundiais', priority: 1 },
	intel: { name: 'Feed de Inteligência', priority: 2 },
	correlation: { name: 'Motor de Correlação', priority: 1 },
	narrative: { name: 'Rastreador de Narrativas', priority: 1 },
	fed: { name: 'Federal Reserve', priority: 1 }
};

export const NON_DRAGGABLE_PANELS: PanelId[] = ['map'];

export const MAP_ZOOM_MIN = 1;
export const MAP_ZOOM_MAX = 4;
export const MAP_ZOOM_STEP = 0.5;
