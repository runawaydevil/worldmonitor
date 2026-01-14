/**
 * Settings store - panel visibility, order, and sizes
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import {
	PANELS,
	NON_DRAGGABLE_PANELS,
	PRESETS,
	type PanelId
} from '$lib/config';

// Storage keys
const STORAGE_KEYS = {
	panels: 'situationMonitorPanels',
	order: 'panelOrder',
	sizes: 'panelSizes'
} as const;

// Types
export interface PanelSettings {
	enabled: Record<PanelId, boolean>;
	order: PanelId[];
	sizes: Record<PanelId, { width?: number; height?: number }>;
}

export interface SettingsState extends PanelSettings {
	initialized: boolean;
}

// Default settings
function getDefaultSettings(): PanelSettings {
	const allPanelIds = Object.keys(PANELS) as PanelId[];
	
	// Garantir ordem: map primeiro, youtube logo após, depois os demais
	const orderedPanelIds: PanelId[] = [];
	if (allPanelIds.includes('map')) {
		orderedPanelIds.push('map');
	}
	if (allPanelIds.includes('youtube')) {
		orderedPanelIds.push('youtube');
	}
	// Adicionar os demais painéis (exceto map e youtube que já foram adicionados)
	allPanelIds.forEach((id) => {
		if (id !== 'map' && id !== 'youtube') {
			orderedPanelIds.push(id);
		}
	});

	return {
		enabled: Object.fromEntries(allPanelIds.map((id) => [id, true])) as Record<PanelId, boolean>,
		order: orderedPanelIds,
		sizes: {} as Record<PanelId, { width?: number; height?: number }>
	};
}

// Load from localStorage
function loadFromStorage(): Partial<PanelSettings> {
	if (!browser) return {};

	try {
		const panels = localStorage.getItem(STORAGE_KEYS.panels);
		const order = localStorage.getItem(STORAGE_KEYS.order);
		const sizes = localStorage.getItem(STORAGE_KEYS.sizes);

		return {
			enabled: panels ? JSON.parse(panels) : undefined,
			order: order ? JSON.parse(order) : undefined,
			sizes: sizes ? JSON.parse(sizes) : undefined
		};
	} catch (e) {
		console.warn('Falha ao carregar configurações do localStorage:', e);
		return {};
	}
}

// Save to localStorage
function saveToStorage(key: keyof typeof STORAGE_KEYS, value: unknown): void {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
	} catch (e) {
		console.warn(`Falha ao salvar ${key} no localStorage:`, e);
	}
}

// Create the store
function createSettingsStore() {
	const defaults = getDefaultSettings();
	const saved = loadFromStorage();

	const initialState: SettingsState = {
		enabled: { ...defaults.enabled, ...saved.enabled },
		order: saved.order ?? defaults.order,
		sizes: { ...defaults.sizes, ...saved.sizes },
		initialized: false
	};

	const { subscribe, set, update } = writable<SettingsState>(initialState);

	return {
		subscribe,

		/**
		 * Initialize store (call after hydration)
		 */
		init() {
			update((state) => ({ ...state, initialized: true }));
		},

		/**
		 * Check if a panel is enabled
		 */
		isPanelEnabled(panelId: PanelId): boolean {
			const state = get({ subscribe });
			return state.enabled[panelId] ?? true;
		},

		/**
		 * Toggle panel visibility
		 */
		togglePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = {
					...state.enabled,
					[panelId]: !state.enabled[panelId]
				};
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Enable a specific panel
		 */
		enablePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = { ...state.enabled, [panelId]: true };
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Disable a specific panel
		 */
		disablePanel(panelId: PanelId) {
			update((state) => {
				const newEnabled = { ...state.enabled, [panelId]: false };
				saveToStorage('panels', newEnabled);
				return { ...state, enabled: newEnabled };
			});
		},

		/**
		 * Update panel order (for drag-drop)
		 */
		updateOrder(newOrder: PanelId[]) {
			update((state) => {
				saveToStorage('order', newOrder);
				return { ...state, order: newOrder };
			});
		},

		/**
		 * Move a panel to a new position
		 */
		movePanel(panelId: PanelId, toIndex: number) {
			// Don't allow moving non-draggable panels
			if (NON_DRAGGABLE_PANELS.includes(panelId)) return;

			update((state) => {
				const currentIndex = state.order.indexOf(panelId);
				if (currentIndex === -1) return state;

				const newOrder = [...state.order];
				newOrder.splice(currentIndex, 1);
				newOrder.splice(toIndex, 0, panelId);

				saveToStorage('order', newOrder);
				return { ...state, order: newOrder };
			});
		},

		/**
		 * Update panel size
		 */
		updateSize(panelId: PanelId, size: { width?: number; height?: number }) {
			update((state) => {
				const newSizes = {
					...state.sizes,
					[panelId]: { ...state.sizes[panelId], ...size }
				};
				saveToStorage('sizes', newSizes);
				return { ...state, sizes: newSizes };
			});
		},

		/**
		 * Reset all settings to defaults
		 * Note: This does NOT reset onboarding status - use resetOnboarding() separately if needed
		 */
		reset() {
			const defaults = getDefaultSettings();
			if (browser) {
				localStorage.removeItem(STORAGE_KEYS.panels);
				localStorage.removeItem(STORAGE_KEYS.order);
				localStorage.removeItem(STORAGE_KEYS.sizes);
			}
			set({ ...defaults, initialized: true });
		},

		/**
		 * Get panel size
		 */
		getPanelSize(panelId: PanelId): { width?: number; height?: number } | undefined {
			const state = get({ subscribe });
			return state.sizes[panelId];
		},

	};
}

// Export singleton store
export const settings = createSettingsStore();

// Derived stores for convenience
export const enabledPanels = derived(settings, ($settings) =>
	$settings.order.filter((id) => $settings.enabled[id])
);

export const disabledPanels = derived(settings, ($settings) =>
	$settings.order.filter((id) => !$settings.enabled[id])
);

export const draggablePanels = derived(enabledPanels, ($enabled) =>
	$enabled.filter((id) => !NON_DRAGGABLE_PANELS.includes(id))
);
