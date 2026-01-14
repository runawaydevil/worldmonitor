<script lang="ts">
	import { onMount } from 'svelte';
	import { Header, Dashboard, Footer } from '$lib/components/layout';
	import { MonitorFormModal } from '$lib/components/modals';
	import {
		NewsPanel,
		MarketsPanel,
		HeatmapPanel,
		CommoditiesPanel,
		CryptoPanel,
		MainCharPanel,
		MonitorsPanel,
		PolymarketPanel,
		ContractsPanel,
		LayoffsPanel,
		IntelPanel,
		SituationPanel,
		WorldLeadersPanel,
		PrinterPanel,
		FedPanel,
		YouTubePanel
	} from '$lib/components/panels';
	
	// Lazy load componentes pesados - usando $state para reatividade
	let MapPanel = $state<any>(null);
	let CorrelationPanel = $state<any>(null);
	let NarrativePanel = $state<any>(null);
	
	// Log inicial removido - estava capturando valores iniciais
	
	// Carregar componentes pesados dinamicamente
	async function loadHeavyComponents() {
		if (isPanelVisible('map') && !MapPanel) {
			const module = await import('$lib/components/panels/MapPanel.svelte');
			MapPanel = module.default;
		}
		if (isPanelVisible('correlation') && !CorrelationPanel) {
			const module = await import('$lib/components/panels/CorrelationPanel.svelte');
			CorrelationPanel = module.default;
		}
		if (isPanelVisible('narrative') && !NarrativePanel) {
			const module = await import('$lib/components/panels/NarrativePanel.svelte');
			NarrativePanel = module.default;
		}
	}
	import {
		news,
		markets,
		monitors,
		settings,
		refresh,
		allNewsItems,
		fedIndicators,
		fedNews
	} from '$lib/stores';
	import {
		fetchAllNews,
		fetchAllMarkets,
		fetchPolymarket,
		fetchGovContracts,
		fetchLayoffs,
		fetchWorldLeaders,
		fetchFedIndicators,
		fetchFedNews
	} from '$lib/api';
	import type { Prediction, Contract, Layoff } from '$lib/api';
	import type { CustomMonitor, WorldLeader } from '$lib/types';
	import type { PanelId } from '$lib/config';

	// Modal state
	let monitorFormOpen = $state(false);
	let editingMonitor = $state<CustomMonitor | null>(null);

	// Misc panel data
	let predictions = $state<Prediction[]>([]);
	let contracts = $state<Contract[]>([]);
	let layoffs = $state<Layoff[]>([]);
	let leaders = $state<WorldLeader[]>([]);
	let leadersLoading = $state(false);

	// Data fetching
	async function loadNews() {
		// Set loading for all categories
		const categories = ['politics', 'tech', 'finance', 'gov', 'ai', 'intel'] as const;
		categories.forEach((cat) => news.setLoading(cat, true));

		try {
			const data = await fetchAllNews();
			Object.entries(data).forEach(([category, items]) => {
				news.setItems(category as keyof typeof data, items);
			});
		} catch (error) {
			categories.forEach((cat) => news.setError(cat, String(error)));
		} finally {
			// Always clear loading state
			categories.forEach((cat) => news.setLoading(cat, false));
		}
	}

	async function loadMarkets() {
		try {
			const data = await fetchAllMarkets();
			markets.setIndices(data.indices);
			markets.setSectors(data.sectors);
			markets.setCommodities(data.commodities);
			markets.setCrypto(data.crypto);
		} catch (error) {
			console.error('Failed to load markets:', error);
			// Set empty data to prevent blocking
			markets.setIndices([]);
			markets.setSectors([]);
			markets.setCommodities([]);
			markets.setCrypto([]);
		}
	}

	async function loadMiscData() {
		try {
			// Add timeout for consistency, even though these are synchronous
			const loadPromise = Promise.all([
				fetchPolymarket(),
				fetchGovContracts(),
				fetchLayoffs()
			]);
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Timeout ao carregar dados diversos')), 10000)
			);

			const [predictionsData, contractsData, layoffsData] = await Promise.race([
				loadPromise,
				timeoutPromise
			]) as [Prediction[], Contract[], Layoff[]];

			predictions = predictionsData;
			contracts = contractsData;
			layoffs = layoffsData;
		} catch (error) {
			console.error('Failed to load misc data:', error);
			// Set default empty values to prevent blocking
			predictions = [];
			contracts = [];
			layoffs = [];
		}
	}

	async function loadWorldLeaders() {
		if (!isPanelVisible('leaders')) return;
		leadersLoading = true;
		try {
			leaders = await fetchWorldLeaders();
		} catch (error) {
			console.error('Failed to load world leaders:', error);
		} finally {
			leadersLoading = false;
		}
	}

	async function loadFedData() {
		if (!isPanelVisible('fed')) return;
		fedIndicators.setLoading(true);
		fedNews.setLoading(true);
		try {
			const [indicatorsData, newsData] = await Promise.all([fetchFedIndicators(), fetchFedNews()]);
			fedIndicators.setData(indicatorsData);
			fedNews.setItems(newsData);
		} catch (error) {
			console.error('Failed to load Fed data:', error);
			fedIndicators.setError(String(error));
			fedNews.setError(String(error));
		} finally {
			// Always clear loading state
			fedIndicators.setLoading(false);
			fedNews.setLoading(false);
		}
	}

	// Refresh handlers
	async function handleRefresh() {
		refresh.startRefresh();
		try {
			// Add timeout to prevent infinite loading
			const loadPromise = Promise.all([loadNews(), loadMarkets()]);
			const timeoutPromise = new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Timeout ao atualizar dados')), 30000)
			);
			
			await Promise.race([loadPromise, timeoutPromise]);
			refresh.endRefresh();
		} catch (error) {
			refresh.endRefresh([String(error)]);
		}
	}

	// Monitor handlers
	function handleCreateMonitor() {
		editingMonitor = null;
		monitorFormOpen = true;
	}

	function handleEditMonitor(monitor: CustomMonitor) {
		editingMonitor = monitor;
		monitorFormOpen = true;
	}

	function handleDeleteMonitor(id: string) {
		monitors.deleteMonitor(id);
	}

	function handleToggleMonitor(id: string) {
		monitors.toggleMonitor(id);
	}

	// Get panel visibility
	function isPanelVisible(id: PanelId): boolean {
		return $settings.enabled[id] !== false;
	}

	// Initial load
	onMount(() => {
		// Load heavy components
		loadHeavyComponents();

		// Load initial data and track as refresh
		async function initialLoad() {
			refresh.startRefresh();
			
			// Safety timeout: garante que endRefresh() sempre seja chamado
			const safetyTimeout = setTimeout(() => {
				refresh.endRefresh(['Timeout de segurança: carregamento inicial excedeu 35 segundos']);
			}, 35000);

			try {
				// Add timeout to prevent infinite loading
				const loadPromise = Promise.all([
					loadNews(),
					loadMarkets(),
					loadMiscData(),
					loadWorldLeaders(),
					loadFedData()
				]);
				
				const timeoutPromise = new Promise((_, reject) => 
					setTimeout(() => reject(new Error('Timeout ao carregar dados')), 30000)
				);
				
				await Promise.race([loadPromise, timeoutPromise]);
				clearTimeout(safetyTimeout);
				refresh.endRefresh();
			} catch (error) {
				clearTimeout(safetyTimeout);
				refresh.endRefresh([String(error)]);
			}
		}
		initialLoad();
		refresh.setupAutoRefresh(handleRefresh);

		return () => {
			refresh.stopAutoRefresh();
		};
	});
</script>

<svelte:head>
	<title>Watchman</title>
	<meta name="description" content="Dashboard de monitoramento global em tempo real" />
</svelte:head>

<div class="app">
	<Header />

	<main id="main-content" class="main-content" aria-label="Conteúdo principal">
		<Dashboard>
			<!-- Renderizar painéis na ordem salva -->
			{#each $settings.order as panelId}
				{@const isVisible = isPanelVisible(panelId)}
				{#if isVisible}
					<div class="panel-slot" class:map-slot={panelId === 'map'} class:youtube-slot={panelId === 'youtube'}>
						{#if panelId === 'map'}
							{#if MapPanel}
								{@const MapPanelComponent = MapPanel}
								<MapPanelComponent
									monitors={$monitors.monitors}
									news={$allNewsItems}
									leaders={leaders}
									fedNews={$fedNews.items}
								/>
							{:else}
								<div class="loading-placeholder">Carregando mapa...</div>
							{/if}
						{:else if panelId === 'youtube'}
							<YouTubePanel />
						{:else if panelId === 'politics'}
							<NewsPanel category="politics" panelId="politics" title="Mundo / Geopolítica" />
						{:else if panelId === 'tech'}
							<NewsPanel category="tech" panelId="tech" title="Tecnologia / IA" />
						{:else if panelId === 'finance'}
							<NewsPanel category="finance" panelId="finance" title="Financeiro" />
						{:else if panelId === 'gov'}
							<NewsPanel category="gov" panelId="gov" title="Governo / Política" />
						{:else if panelId === 'ai'}
							<NewsPanel category="ai" panelId="ai" title="IA" />
						{:else if panelId === 'markets'}
							<MarketsPanel />
						{:else if panelId === 'heatmap'}
							<HeatmapPanel />
						{:else if panelId === 'commodities'}
							<CommoditiesPanel />
						{:else if panelId === 'crypto'}
							<CryptoPanel />
						{:else if panelId === 'correlation'}
							{#if CorrelationPanel}
								{@const CorrelationPanelComponent = CorrelationPanel}
								<CorrelationPanelComponent news={$allNewsItems} />
							{:else}
								<div class="loading-placeholder">Carregando correlações...</div>
							{/if}
						{:else if panelId === 'narrative'}
							{#if NarrativePanel}
								{@const NarrativePanelComponent = NarrativePanel}
								<NarrativePanelComponent news={$allNewsItems} />
							{:else}
								<div class="loading-placeholder">Carregando narrativas...</div>
							{/if}
						{:else if panelId === 'mainchar'}
							<MainCharPanel />
						{:else if panelId === 'intel'}
							<IntelPanel />
						{:else if panelId === 'fed'}
							<FedPanel />
						{:else if panelId === 'leaders'}
							<WorldLeadersPanel {leaders} loading={leadersLoading} />
						{:else if panelId === 'monitors'}
							<MonitorsPanel
								monitors={$monitors.monitors}
								matches={$monitors.matches}
								onCreateMonitor={handleCreateMonitor}
								onEditMonitor={handleEditMonitor}
								onDeleteMonitor={handleDeleteMonitor}
								onToggleMonitor={handleToggleMonitor}
							/>
						{:else if panelId === 'polymarket'}
							<PolymarketPanel {predictions} />
						{:else if panelId === 'contracts'}
							<ContractsPanel {contracts} />
						{:else if panelId === 'layoffs'}
							<LayoffsPanel {layoffs} />
						{:else if panelId === 'printer'}
							<PrinterPanel />
						{:else if panelId === 'venezuela'}
							<SituationPanel
								panelId="venezuela"
								config={{
									title: 'Monitor Venezuela',
									subtitle: 'Monitoramento de crise humanitária',
									criticalKeywords: ['maduro', 'caracas', 'venezuela', 'guaido']
								}}
								news={$allNewsItems.filter(
									(n) =>
										n.title.toLowerCase().includes('venezuela') ||
										n.title.toLowerCase().includes('maduro')
								)}
							/>
						{:else if panelId === 'greenland'}
							<SituationPanel
								panelId="greenland"
								config={{
									title: 'Monitor Groenlândia',
									subtitle: 'Monitoramento de geopolítica ártica',
									criticalKeywords: ['greenland', 'arctic', 'nuuk', 'denmark']
								}}
								news={$allNewsItems.filter(
									(n) =>
										n.title.toLowerCase().includes('greenland') ||
										n.title.toLowerCase().includes('arctic')
								)}
							/>
						{:else if panelId === 'iran'}
							<SituationPanel
								panelId="iran"
								config={{
									title: 'Crise do Irã',
									subtitle: 'Protestos revolucionários, instabilidade do regime e programa nuclear',
									criticalKeywords: [
										'protest',
										'uprising',
										'revolution',
										'crackdown',
										'killed',
										'nuclear',
										'strike',
										'attack',
										'irgc',
										'khamenei'
									]
								}}
								news={$allNewsItems.filter(
									(n) =>
										n.title.toLowerCase().includes('iran') ||
										n.title.toLowerCase().includes('tehran') ||
										n.title.toLowerCase().includes('irgc')
								)}
							/>
						{/if}
					</div>
				{/if}
			{/each}
		</Dashboard>
	</main>

	<!-- Modals -->
	<MonitorFormModal
		open={monitorFormOpen}
		onClose={() => (monitorFormOpen = false)}
		editMonitor={editingMonitor}
	/>
	<Footer />
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	.main-content {
		flex: 1;
		padding: 0.5rem;
		overflow-y: auto;
	}

	.map-slot {
		column-span: all;
		margin-bottom: 0.5rem;
	}

	.youtube-slot {
		margin-bottom: 0.5rem;
		break-inside: avoid;
		width: 100%;
		box-sizing: border-box;
	}

	/* YouTube ocupa 2 colunas respeitando o grid */
	.youtube-slot :global(.panel) {
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
	}

	.loading-placeholder {
		padding: 2rem;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.7rem;
	}

	@media (max-width: 768px) {
		.main-content {
			padding: 0.25rem;
		}
	}
</style>
