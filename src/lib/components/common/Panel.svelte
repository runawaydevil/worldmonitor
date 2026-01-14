<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { PanelId } from '$lib/config';

	interface Props {
		id: PanelId;
		title: string;
		count?: number | string | null;
		status?: string;
		statusClass?: string;
		loading?: boolean;
		error?: string | null;
		draggable?: boolean;
		collapsible?: boolean;
		collapsed?: boolean;
		onCollapse?: () => void;
		header?: Snippet;
		actions?: Snippet;
		children: Snippet;
	}

	let {
		id,
		title,
		count = null,
		status = '',
		statusClass = '',
		loading = false,
		error = null,
		draggable = true,
		collapsible = false,
		collapsed = false,
		onCollapse,
		header,
		actions,
		children
	}: Props = $props();

	function handleCollapse() {
		if (collapsible && onCollapse) {
			onCollapse();
		}
	}
</script>

<div
	class="panel"
	class:draggable
	class:collapsed
	data-panel-id={id}
	role="region"
	aria-labelledby={`panel-title-${id}`}
	aria-live="polite"
	aria-busy={loading}
>
	<div class="panel-header">
		<div class="panel-title-row">
			<h3 id={`panel-title-${id}`} class="panel-title">{title}</h3>
			{#if count !== null}
				<span class="panel-count" aria-label={`${count} itens`}>{count}</span>
			{/if}
			{#if status}
				<span class="panel-status {statusClass}" role="status" aria-live="polite">{status}</span>
			{/if}
			{#if loading}
				<span class="panel-loading" aria-label="Carregando" role="status"></span>
			{/if}
		</div>

		{#if header}
			{@render header()}
		{/if}

		<div class="panel-actions">
			{#if actions}
				{@render actions()}
			{/if}
			{#if collapsible}
				<button
					class="panel-collapse-btn"
					onclick={handleCollapse}
					aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'}
					aria-expanded={!collapsed}
					aria-controls={`panel-content-${id}`}
				>
					{collapsed ? '▼' : '▲'}
				</button>
			{/if}
		</div>
	</div>

	<div
		id={`panel-content-${id}`}
		class="panel-content"
		class:hidden={collapsed}
		role="region"
		aria-hidden={collapsed}
	>
		{#if error}
			<div class="error-msg" role="alert" aria-live="assertive">{error}</div>
		{:else if loading}
			<div class="loading-msg" role="status" aria-live="polite">Carregando...</div>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.panel {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.panel.draggable {
		cursor: grab;
	}

	.panel.draggable:active {
		cursor: grabbing;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: clamp(0.6rem, 1.6vw, 0.9rem) clamp(0.7rem, 1.8vw, 1rem);
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		min-height: 2rem;
	}

	.panel-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.panel-title {
		font-size: clamp(0.8rem, 1.8vw, 0.95rem);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.panel-count {
		font-size: clamp(0.75rem, 1.6vw, 0.9rem);
		font-weight: 500;
		color: var(--accent);
		background: rgba(var(--accent-rgb), 0.1);
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
	}

	.panel-status {
		font-size: clamp(0.7rem, 1.5vw, 0.85rem);
		font-weight: 600;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.panel-status.monitoring {
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.05);
	}

	.panel-status.elevated {
		color: #ffa500;
		background: rgba(255, 165, 0, 0.15);
	}

	.panel-status.critical {
		color: #ff4444;
		background: rgba(255, 68, 68, 0.15);
	}

	.panel-loading {
		width: 12px;
		height: 12px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.panel-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.panel-collapse-btn {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		font-size: 0.8rem;
		line-height: 1;
	}

	.panel-collapse-btn:hover {
		color: var(--text-primary);
	}

	.panel-content {
		flex: 1;
		overflow-y: auto;
		padding: clamp(0.75rem, 1.8vw, 1rem);
	}

	.panel-content.hidden {
		display: none;
	}

	.error-msg {
		color: var(--danger);
		text-align: center;
		padding: 1rem;
		font-size: clamp(0.85rem, 2vw, 1rem);
	}

	.loading-msg {
		color: var(--text-secondary);
		text-align: center;
		padding: 1rem;
		font-size: clamp(0.85rem, 2vw, 1rem);
	}
</style>
