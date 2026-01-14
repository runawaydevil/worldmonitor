<script lang="ts">
	import { onMount } from 'svelte';
	import { isRefreshing, lastRefresh } from '$lib/stores';

	const lastRefreshText = $derived(
		$lastRefresh
			? `Última atualização: ${new Date($lastRefresh).toLocaleTimeString('pt-BR', { hour: 'numeric', minute: '2-digit' })}`
			: 'Nunca atualizado'
	);

	let currentTime = $state(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

	onMount(() => {
		const interval = setInterval(() => {
			currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<header class="header">
	<div class="header-left">
		<h1 class="logo">GRUPO MURAD</h1>
	</div>

	<div class="header-center">
		<div class="refresh-status">
			{#if $isRefreshing}
				<span class="status-text loading">Atualizando...</span>
			{:else}
				<span class="status-text">{lastRefreshText}</span>
			{/if}
		</div>
	</div>

	<div class="header-right">
		<div class="clock">{currentTime}</div>
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 100;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: baseline;
		flex-shrink: 0;
	}

	.logo {
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #ffff00;
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		text-shadow: 
			0 0 5px #ffaa00,
			0 0 10px #ffaa00,
			0 0 15px #ffaa00,
			0 0 20px #ffaa00,
			2px 2px 0px rgba(0, 0, 0, 0.5),
			4px 4px 0px rgba(0, 0, 0, 0.3);
		filter: drop-shadow(0 0 8px #ffaa00);
		animation: neon-glow 2s ease-in-out infinite alternate;
	}

	@keyframes neon-glow {
		from {
			text-shadow: 
				0 0 5px #ffaa00,
				0 0 10px #ffaa00,
				0 0 15px #ffaa00,
				0 0 20px #ffaa00,
				2px 2px 0px rgba(0, 0, 0, 0.5),
				4px 4px 0px rgba(0, 0, 0, 0.3);
			filter: drop-shadow(0 0 8px #ffaa00);
		}
		to {
			text-shadow: 
				0 0 8px #ffaa00,
				0 0 15px #ffaa00,
				0 0 20px #ffaa00,
				0 0 25px #ffaa00,
				2px 2px 0px rgba(0, 0, 0, 0.5),
				4px 4px 0px rgba(0, 0, 0, 0.3);
			filter: drop-shadow(0 0 12px #ffaa00);
		}
	}

	.header-center {
		display: flex;
		align-items: center;
		flex: 1;
		justify-content: center;
		min-width: 0;
	}

	.refresh-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-text {
		font-size: 0.6rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status-text.loading {
		color: var(--accent);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.clock {
		font-size: 0.7rem;
		color: var(--text-muted);
		font-family: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;
		white-space: nowrap;
		padding: 0.25rem 0.5rem;
		background: var(--bg-secondary);
		border-radius: 4px;
	}

	.header-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		min-height: 44px;
		min-width: 44px;
		padding: 0.4rem 0.75rem;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		font-size: 0.65rem;
	}

	.header-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	.btn-icon {
		font-size: 0.8rem;
	}

	.btn-label {
		display: none;
	}

	@media (min-width: 768px) {
		.btn-label {
			display: inline;
		}
	}
</style>
