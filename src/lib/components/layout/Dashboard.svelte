<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Removido @dnd-kit (biblioteca React incompatível com Svelte)
	// Drag-drop será implementado nativamente via HTML5 Drag and Drop API
</script>

<main class="dashboard" aria-label="Dashboard de painéis">
	<div class="dashboard-grid" role="list" aria-label="Lista de painéis">
		{@render children()}
	</div>
</main>

<style>
	.dashboard {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
	}

	.dashboard-grid {
		column-count: 1;
		column-gap: 0.5rem;
		max-width: 2000px;
		margin: 0 auto;
	}

	.dashboard-grid > :global(*) {
		break-inside: avoid;
		margin-bottom: 0.5rem;
		page-break-inside: avoid;
	}

	/* Mobile muito pequeno */
	@media (max-width: 359px) {
		.dashboard {
			padding: 0.25rem;
		}
		.dashboard-grid {
			column-gap: 0.25rem;
		}
		.dashboard-grid > :global(*) {
			margin-bottom: 0.25rem;
		}
	}

	/* Mobile-first: tablets pequenos */
	@media (min-width: 480px) {
		.dashboard-grid {
			column-count: 1;
		}
	}

	/* Tablets */
	@media (min-width: 768px) {
		.dashboard-grid {
			column-count: 2;
			column-gap: 0.75rem;
		}
	}

	/* Desktop pequeno */
	@media (min-width: 1024px) {
		.dashboard-grid {
			column-count: 3;
		}
	}

	/* Desktop médio */
	@media (min-width: 1280px) {
		.dashboard-grid {
			column-count: 4;
		}
	}

	/* Desktop grande */
	@media (min-width: 1600px) {
		.dashboard-grid {
			column-count: 5;
		}
	}

	/* Desktop muito grande */
	@media (min-width: 2000px) {
		.dashboard-grid {
			column-count: 6;
		}
	}

	/* Orientação landscape em mobile */
	@media (max-width: 767px) and (orientation: landscape) {
		.dashboard-grid {
			column-count: 2;
		}
	}
</style>
