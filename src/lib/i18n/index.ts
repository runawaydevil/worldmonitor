/**
 * Sistema de Internacionalização (i18n) para Watchman
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { Translations } from './pt-BR';

export type Locale = 'pt-BR' | 'en-US';

const STORAGE_KEY = 'watchman_locale';
const DEFAULT_LOCALE: Locale = 'pt-BR';

// Importar traduções
import ptBR from './pt-BR';

const translations: Record<Locale, Translations> = {
	'pt-BR': ptBR,
	'en-US': ptBR // Por enquanto, inglês usa português (será implementado depois)
};

// Store de locale
function createI18nStore() {
	const savedLocale = browser
		? (localStorage.getItem(STORAGE_KEY) as Locale) || DEFAULT_LOCALE
		: DEFAULT_LOCALE;

	const { subscribe, set, update } = writable<Locale>(savedLocale);

	return {
		subscribe,

		/**
		 * Define o locale atual
		 */
		setLocale(locale: Locale) {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, locale);
			}
			set(locale);
		},

		/**
		 * Obtém o locale atual
		 */
		getLocale(): Locale {
			return get({ subscribe });
		}
	};
}

export const i18n = createI18nStore();

/**
 * Helper reativo para traduções
 * Uso: $t('common.welcome')
 */
export const t = derived(i18n, ($locale) => {
	return (key: string, params?: Record<string, string | number>): string => {
		const keys = key.split('.');
		let value: any = translations[$locale];

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				console.warn(`Translation key not found: ${key}`);
				return key;
			}
		}

		if (typeof value !== 'string') {
			console.warn(`Translation value is not a string: ${key}`);
			return key;
		}

		// Substituir parâmetros
		if (params) {
			return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
				return params[paramKey]?.toString() || match;
			});
		}

		return value;
	};
});

/**
 * Helper não-reativo para traduções (útil em funções)
 */
export function translate(key: string, params?: Record<string, string | number>): string {
	const locale = i18n.getLocale();
	const keys = key.split('.');
	let value: any = translations[locale];

	for (const k of keys) {
		if (value && typeof value === 'object' && k in value) {
			value = value[k];
		} else {
			console.warn(`Translation key not found: ${key}`);
			return key;
		}
	}

	if (typeof value !== 'string') {
		console.warn(`Translation value is not a string: ${key}`);
		return key;
	}

	if (params) {
		return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
			return params[paramKey]?.toString() || match;
		});
	}

	return value;
}
