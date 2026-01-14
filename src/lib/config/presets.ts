/**
 * Presets de onboarding para usuários pela primeira vez
 */

import type { PanelId } from './panels';

export interface Preset {
	id: string;
	name: string;
	icon: string;
	description: string;
	panels: PanelId[];
}

export const PRESETS: Record<string, Preset> = {
	'news-junkie': {
		id: 'news-junkie',
		name: 'Viciado em Notícias',
		icon: '📰',
		description: 'Fique por dentro das últimas notícias de política, tecnologia e finanças',
		panels: ['politics', 'tech', 'finance', 'gov', 'ai', 'mainchar', 'map']
	},
	trader: {
		id: 'trader',
		name: 'Trader',
		icon: '📈',
		description: 'Dashboard focado em mercados com ações, criptomoedas e commodities',
		panels: [
			'markets',
			'heatmap',
			'commodities',
			'crypto',
			'polymarket',
			'printer',
			'finance',
			'map'
		]
	},
	geopolitics: {
		id: 'geopolitics',
		name: 'Observador Geopolítico',
		icon: '🌍',
		description: 'Consciência situacional global e pontos críticos regionais',
		panels: [
			'map',
			'intel',
			'leaders',
			'politics',
			'gov',
			'venezuela',
			'greenland',
			'iran',
			'correlation',
			'narrative'
		]
	},
	intel: {
		id: 'intel',
		name: 'Analista de Inteligência',
		icon: '🔍',
		description: 'Análise profunda, detecção de padrões e rastreamento de narrativas',
		panels: ['map', 'intel', 'leaders', 'correlation', 'narrative', 'mainchar', 'politics']
	},
	minimal: {
		id: 'minimal',
		name: 'Mínimo',
		icon: '⚡',
		description: 'Apenas o essencial - mapa, notícias e mercados',
		panels: ['map', 'politics', 'markets']
	},
	everything: {
		id: 'everything',
		name: 'Tudo',
		icon: '🎛️',
		description: 'Tudo incluído - todos os painéis habilitados',
		panels: [
			'map',
			'politics',
			'tech',
			'finance',
			'gov',
			'heatmap',
			'markets',
			'monitors',
			'commodities',
			'crypto',
			'polymarket',
			'mainchar',
			'printer',
			'contracts',
			'ai',
			'layoffs',
			'venezuela',
			'greenland',
			'iran',
			'leaders',
			'intel',
			'correlation',
			'narrative'
		]
	}
};

export const PRESET_ORDER = [
	'news-junkie',
	'trader',
	'geopolitics',
	'intel',
	'minimal',
	'everything'
];

// Storage keys
export const ONBOARDING_STORAGE_KEY = 'onboardingComplete';
export const PRESET_STORAGE_KEY = 'selectedPreset';
