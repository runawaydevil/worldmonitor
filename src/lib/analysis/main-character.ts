/**
 * Análise de Personagem Principal - rastreia figuras proeminentes nas notícias
 */

import type { NewsItem } from '$lib/types';
import { PERSON_PATTERNS } from '$lib/config/analysis';

export interface MainCharacterEntry {
	name: string;
	count: number;
	rank: number;
}

export interface MainCharacterResults {
	characters: MainCharacterEntry[];
	topCharacter: MainCharacterEntry | null;
}

/**
 * Calcular o "Personagem Principal" (pessoa mais mencionada) a partir dos títulos de notícias
 */
export function calculateMainCharacter(allNews: NewsItem[]): MainCharacterResults {
	if (!allNews || allNews.length === 0) {
		return { characters: [], topCharacter: null };
	}

	const counts: Record<string, number> = {};

	// Count mentions for each person
	for (const item of allNews) {
		const text = (item.title || '').toLowerCase();

		for (const { pattern, name } of PERSON_PATTERNS) {
			// Reset lastIndex for global regex
			pattern.lastIndex = 0;
			const matches = text.match(pattern);

			if (matches) {
				counts[name] = (counts[name] || 0) + matches.length;
			}
		}
	}

	// Sort by count and create ranked entries
	const sorted = Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([name, count], index) => ({
			name,
			count,
			rank: index + 1
		}));

	return {
		characters: sorted,
		topCharacter: sorted[0] || null
	};
}

/**
 * Obter um resumo do personagem principal para exibição
 */
export function getMainCharacterSummary(results: MainCharacterResults): {
	name: string;
	count: number;
	status: string;
} {
	if (!results.topCharacter) {
		return { name: '', count: 0, status: 'NO DATA' };
	}

	const { name, count } = results.topCharacter;
	return {
		name,
		count,
		status: `${name} (${count} mentions)`
	};
}

/**
 * Calcular dominância relativa do personagem principal
 * Retorna um valor 0-100 representando quão dominante o personagem principal é
 */
export function calculateDominance(results: MainCharacterResults): number {
	if (results.characters.length < 2) return 100;

	const top = results.characters[0];
	const second = results.characters[1];

	if (!top || top.count === 0) return 0;
	if (!second || second.count === 0) return 100;

	// Dominance is how much more the top is mentioned vs second
	const ratio = top.count / second.count;
	// Convert to 0-100 scale (ratio of 2 = 100% dominant)
	return Math.min(100, Math.round((ratio - 1) * 100));
}
