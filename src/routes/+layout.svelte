<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();

	// Registrar Service Worker
	onMount(() => {
		if (browser && 'serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js')
				.then((registration) => {
					console.log('Service Worker registrado:', registration.scope);
				})
				.catch((error) => {
					console.error('Erro ao registrar Service Worker:', error);
				});
		}
	});
</script>

<div class="min-h-screen bg-bg text-text-primary">
	{@render children()}
</div>
