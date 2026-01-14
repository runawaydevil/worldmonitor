<script lang="ts">
	import { onMount } from 'svelte';
	import { Panel } from '$lib/components/common';
	import {
		HOTSPOTS,
		CONFLICT_ZONES,
		CHOKEPOINTS,
		CABLE_LANDINGS,
		NUCLEAR_SITES,
		MILITARY_BASES,
		OCEANS,
		SANCTIONED_COUNTRY_IDS,
		THREAT_COLORS,
		WEATHER_CODES
	} from '$lib/config/map';
	import { CACHE_TTLS } from '$lib/config/api';
	import { PANELS } from '$lib/config';
	import type { CustomMonitor, NewsItem, WorldLeader } from '$lib/types';
	import type { FedNewsItem } from '$lib/api/fred';
	import {
		geocodeBrazilianCity,
		detectRegion,
		geocodeGlobalLocation,
		geocodeCountry
	} from '$lib/config/keywords';
	import type { NewsCategory } from '$lib/types';

	interface Props {
		monitors?: CustomMonitor[];
		news?: NewsItem[];
		leaders?: WorldLeader[];
		fedNews?: FedNewsItem[];
		loading?: boolean;
		error?: string | null;
	}

	let {
		monitors = [],
		news = [],
		leaders = [],
		fedNews = [],
		loading = false,
		error = null
	}: Props = $props();

	// Interface para eventos do mapa
	interface MapEvent {
		id: string;
		type: 'news' | 'leader' | 'fed' | 'monitor' | 'alert';
		lat: number;
		lon: number;
		title: string;
		description?: string;
		category?: NewsCategory;
		timestamp: number;
		color: string;
		icon?: string;
		data: any;
	}

	let mapContainer: HTMLDivElement;
	// D3 objects - initialized in initMap, null before initialization
	// Using 'any' for D3 objects as they're dynamically imported and have complex generic types
	/* eslint-disable @typescript-eslint/no-explicit-any */
	let d3Module: typeof import('d3') | null = null;
	let svg: any = null;
	let mapGroup: any = null;
	let projection: any = null;
	let path: any = null;
	let zoom: any = null;
	/* eslint-enable @typescript-eslint/no-explicit-any */

	// Responsive dimensions - will be set based on container
	let WIDTH = $state(800);
	let HEIGHT = $state(400);

	// Tooltip state
	let tooltipContent = $state<{
		title: string;
		color: string;
		lines: string[];
	} | null>(null);
	let tooltipPosition = $state({ left: 0, top: 0 });
	let tooltipVisible = $state(false);

	// Data cache for tooltips with TTL support
	interface CacheEntry<T> {
		data: T;
		timestamp: number;
	}
	const dataCache: Record<string, CacheEntry<unknown>> = {};

	function getCachedData<T>(key: string): T | null {
		const entry = dataCache[key] as CacheEntry<T> | undefined;
		if (!entry) return null;
		// Check if cache entry has expired
		if (Date.now() - entry.timestamp > CACHE_TTLS.weather) {
			delete dataCache[key];
			return null;
		}
		return entry.data;
	}

	function setCachedData<T>(key: string, data: T): void {
		dataCache[key] = { data, timestamp: Date.now() };
	}

	// Get local time at longitude
	function getLocalTime(lon: number): string {
		const now = new Date();
		const utcHours = now.getUTCHours();
		const utcMinutes = now.getUTCMinutes();
		const offsetHours = Math.round(lon / 15);
		const localHours = (utcHours + offsetHours + 24) % 24;
		const localMinutes = utcMinutes;
		// Usar formato 24h em português
		return new Date(Date.UTC(1970, 0, 1, localHours, localMinutes)).toLocaleTimeString('pt-BR', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});
	}

	// Weather result type
	interface WeatherResult {
		temp: number | null;
		wind: number | null;
		condition: string;
	}

	// Fetch weather from Open-Meteo with TTL-based caching
	async function getWeather(lat: number, lon: number): Promise<WeatherResult | null> {
		const key = `weather_${lat}_${lon}`;
		const cached = getCachedData<WeatherResult>(key);
		if (cached) return cached;

		try {
			const res = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`
			);
			const data = await res.json();
			const temp = data.current?.temperature_2m;
			const wind = data.current?.wind_speed_10m;
			const code = data.current?.weather_code;
			const result: WeatherResult = {
				temp: temp ? Math.round(temp) : null, // Manter em Celsius
				wind: wind ? Math.round(wind * 1.60934) : null, // Converter mph para km/h
				condition: WEATHER_CODES[code] || '—'
			};
			setCachedData(key, result);
			return result;
		} catch {
			return null;
		}
	}

	// Enable zoom/pan behavior on the map
	function enableZoom(): void {
		if (!svg || !zoom) return;
		svg.call(zoom);
	}

	// Calculate day/night terminator points
	function calculateTerminator(): [number, number][] {
		const now = new Date();
		const dayOfYear = Math.floor(
			(now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
		);
		const declination = -23.45 * Math.cos(((360 / 365) * (dayOfYear + 10) * Math.PI) / 180);
		const hourAngle = (now.getUTCHours() + now.getUTCMinutes() / 60) * 15 - 180;

		const terminatorPoints: [number, number][] = [];
		for (let lat = -90; lat <= 90; lat += 2) {
			const tanDec = Math.tan((declination * Math.PI) / 180);
			const tanLat = Math.tan((lat * Math.PI) / 180);
			let lon = -hourAngle + (Math.acos(-tanDec * tanLat) * 180) / Math.PI;
			if (isNaN(lon)) lon = lat * declination > 0 ? -hourAngle + 180 : -hourAngle;
			terminatorPoints.push([lon, lat]);
		}
		for (let lat = 90; lat >= -90; lat -= 2) {
			const tanDec = Math.tan((declination * Math.PI) / 180);
			const tanLat = Math.tan((lat * Math.PI) / 180);
			let lon = -hourAngle - (Math.acos(-tanDec * tanLat) * 180) / Math.PI;
			if (isNaN(lon)) lon = lat * declination > 0 ? -hourAngle - 180 : -hourAngle;
			terminatorPoints.push([lon, lat]);
		}
		return terminatorPoints;
	}

	// Show tooltip using state (safe rendering)
	function showTooltip(
		event: MouseEvent,
		title: string,
		color: string,
		lines: string[] = []
	): void {
		if (!mapContainer) return;
		const rect = mapContainer.getBoundingClientRect();
		tooltipContent = { title, color, lines };
		// Position tooltip to avoid overlapping with markers
		// Offset more to the right and up to avoid covering the marker
		tooltipPosition = {
			left: event.clientX - rect.left + 20,
			top: event.clientY - rect.top - 30
		};
		tooltipVisible = true;
	}

	// Move tooltip
	function moveTooltip(event: MouseEvent): void {
		if (!mapContainer) return;
		const rect = mapContainer.getBoundingClientRect();
		// Keep same offset as showTooltip to avoid marker overlap
		tooltipPosition = {
			left: event.clientX - rect.left + 20,
			top: event.clientY - rect.top - 30
		};
	}

	// Hide tooltip
	function hideTooltip(): void {
		tooltipVisible = false;
		tooltipContent = null;
	}

	// Build enhanced tooltip with weather
	async function showEnhancedTooltip(
		event: MouseEvent,
		_name: string,
		lat: number,
		lon: number,
		desc: string,
		color: string
	): Promise<void> {
		const localTime = getLocalTime(lon);
		const lines = [`🕐 Local: ${localTime}`];
		showTooltip(event, desc, color, lines);

		// Fetch weather asynchronously
		const weather = await getWeather(lat, lon);
		if (weather && tooltipVisible) {
			tooltipContent = {
				title: desc,
				color,
				lines: [
					`🕐 Local: ${localTime}`,
					`${weather.condition} ${weather.temp}°C, ${weather.wind}km/h`
				]
			};
		}
	}

	// Update map dimensions based on container
	function updateMapDimensions(): void {
		if (!mapContainer) return;
		const rect = mapContainer.getBoundingClientRect();
		WIDTH = rect.width || 800;
		HEIGHT = rect.height || 400;

		// #region agent log
		fetch('http://127.0.0.1:7677/ingest/5e0c756f-9c62-45e2-85b5-b97035d41e0a', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: 'debug-session',
				runId: 'run-map-size',
				hypothesisId: 'A',
				location: 'MapPanel.svelte:updateMapDimensions',
				message: 'Computed container size',
				data: { rectWidth: rect.width, rectHeight: rect.height, width: WIDTH, height: HEIGHT },
				timestamp: Date.now()
			})
		}).catch(() => {});
		// #endregion

		if (svg) {
			svg.attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
			if (projection && path && mapGroup) {
				// Update projection scale and translation - use proper calculation for equirectangular
				// Scale should be approximately WIDTH / (2 * PI) for equirectangular to show full world
				const newScale = Math.min(WIDTH, HEIGHT * 2) / (2 * Math.PI) * 0.95;
				projection.scale(newScale).translate([WIDTH / 2, HEIGHT / 2 - 30]);

				// #region agent log
				fetch('http://127.0.0.1:7677/ingest/5e0c756f-9c62-45e2-85b5-b97035d41e0a', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						sessionId: 'debug-session',
						runId: 'run-map-size',
						hypothesisId: 'B',
						location: 'MapPanel.svelte:updateMapDimensions',
						message: 'Applied projection + viewBox',
						data: { width: WIDTH, height: HEIGHT },
						timestamp: Date.now()
					})
				}).catch(() => {});
				// #endregion

				// Redraw map elements
				mapGroup.selectAll('path').attr('d', path);
				drawMonitors();
				drawGlobalNews();
				drawWorldLeadersEvents();
				drawFedEvents();
			}
		}
	}

	// Initialize map
	async function initMap(): Promise<void> {
		const d3 = await import('d3');
		d3Module = d3;
		const topojson = await import('topojson-client');

		const svgEl = mapContainer.querySelector('svg');
		if (!svgEl) return;

		// Set initial dimensions
		updateMapDimensions();

		// #region agent log
		fetch('http://127.0.0.1:7677/ingest/5e0c756f-9c62-45e2-85b5-b97035d41e0a', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: 'debug-session',
				runId: 'run-map-size',
				hypothesisId: 'C',
				location: 'MapPanel.svelte:initMap',
				message: 'Initial dimensions after updateMapDimensions',
				data: { width: WIDTH, height: HEIGHT },
				timestamp: Date.now()
			})
		}).catch(() => {});
		// #endregion

		svg = d3.select(svgEl);
		svg.attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);

		mapGroup = svg.append('g').attr('id', 'mapGroup');

		// Setup zoom - disable scroll wheel, allow touch pinch and buttons
		zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 6])
			.filter((event) => {
				// Block scroll wheel zoom (wheel events)
				if (event.type === 'wheel') return false;
				// Allow touch events (pinch zoom on mobile)
				if (event.type.startsWith('touch')) return true;
				// Allow mouse drag for panning
				if (event.type === 'mousedown' || event.type === 'mousemove') return true;
				// Block double-click zoom
				if (event.type === 'dblclick') return false;
				// Allow other events (programmatic zoom from buttons)
				return true;
			})
			.on('zoom', (event) => {
				mapGroup.attr('transform', event.transform.toString());
			});

		enableZoom();

		// Setup projection with proper scale based on container size
		// Scale should be approximately WIDTH / (2 * PI) for equirectangular to show full world
		const initialScale = Math.min(WIDTH, HEIGHT * 2) / (2 * Math.PI) * 0.95;
		projection = d3
			.geoEquirectangular()
			.scale(initialScale)
			.center([0, 20])
			.translate([WIDTH / 2, HEIGHT / 2 - 30]);

		path = d3.geoPath().projection(projection);

		// Load world data
		try {
			const response = await fetch(
				'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
			);
			const world = await response.json();
			const countries = topojson.feature(
				world,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				world.objects.countries as any
			) as unknown as GeoJSON.FeatureCollection;

			// Draw countries
			mapGroup
				.selectAll('path.country')
				.data(countries.features)
				.enter()
				.append('path')
				.attr('class', 'country')
				.attr('d', path as unknown as string)
				.attr('fill', (d: GeoJSON.Feature) =>
					SANCTIONED_COUNTRY_IDS.includes(+(d.id || 0)) ? '#2a1a1a' : '#0f3028'
				)
				.attr('stroke', (d: GeoJSON.Feature) =>
					SANCTIONED_COUNTRY_IDS.includes(+(d.id || 0)) ? '#4a2020' : '#1a5040'
				)
				.attr('stroke-width', 0.5);

			// Draw graticule
			const graticule = d3.geoGraticule().step([30, 30]);
			mapGroup
				.append('path')
				.datum(graticule)
				.attr('d', path as unknown as string)
				.attr('fill', 'none')
				.attr('stroke', '#1a3830')
				.attr('stroke-width', 0.3)
				.attr('stroke-dasharray', '2,2');

			// Draw ocean labels
			OCEANS.forEach((o) => {
				const [x, y] = projection([o.lon, o.lat]) || [0, 0];
				if (x && y) {
					mapGroup
						.append('text')
						.attr('x', x)
						.attr('y', y)
						.attr('fill', '#1a4a40')
						.attr('font-size', '10px')
						.attr('font-family', 'monospace')
						.attr('text-anchor', 'middle')
						.attr('opacity', 0.6)
						.text(o.name);
				}
			});

			// Draw day/night terminator
			const terminatorPoints = calculateTerminator();
			mapGroup
				.append('path')
				.datum({ type: 'Polygon', coordinates: [terminatorPoints] } as GeoJSON.Polygon)
				.attr('d', path as unknown as string)
				.attr('fill', 'rgba(0,0,0,0.3)')
				.attr('stroke', 'none');

			// Draw conflict zones
			CONFLICT_ZONES.forEach((zone) => {
				mapGroup
					.append('path')
					.datum({ type: 'Polygon', coordinates: [zone.coords] } as GeoJSON.Polygon)
					.attr('d', path as unknown as string)
					.attr('fill', zone.color)
					.attr('fill-opacity', 0.15)
					.attr('stroke', zone.color)
					.attr('stroke-width', 0.5)
					.attr('stroke-opacity', 0.4);
			});

			// Draw chokepoints
			CHOKEPOINTS.forEach((cp) => {
				const [x, y] = projection([cp.lon, cp.lat]) || [0, 0];
				if (x && y) {
					mapGroup
						.append('rect')
						.attr('x', x - 4)
						.attr('y', y - 4)
						.attr('width', 8)
						.attr('height', 8)
						.attr('fill', '#00aaff')
						.attr('opacity', 0.8)
						.attr('transform', `rotate(45,${x},${y})`);
					mapGroup
						.append('text')
						.attr('x', x + 8)
						.attr('y', y + 3)
						.attr('fill', '#00aaff')
						.attr('font-size', '7px')
						.attr('font-family', 'monospace')
						.text(cp.name);
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 10)
						.attr('fill', 'transparent')
						.attr('class', 'hotspot-hit')
						.on('mouseenter', (event: MouseEvent) => showTooltip(event, `⬥ ${cp.desc}`, '#00aaff'))
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});

			// Draw cable landings
			CABLE_LANDINGS.forEach((cl) => {
				const [x, y] = projection([cl.lon, cl.lat]) || [0, 0];
				if (x && y) {
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 3)
						.attr('fill', 'none')
						.attr('stroke', '#aa44ff')
						.attr('stroke-width', 1.5);
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 10)
						.attr('fill', 'transparent')
						.attr('class', 'hotspot-hit')
						.on('mouseenter', (event: MouseEvent) => showTooltip(event, `◎ ${cl.desc}`, '#aa44ff'))
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});

			// Draw nuclear sites
			NUCLEAR_SITES.forEach((ns) => {
				const [x, y] = projection([ns.lon, ns.lat]) || [0, 0];
				if (x && y) {
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 2)
						.attr('fill', '#ffff00');
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 5)
						.attr('fill', 'none')
						.attr('stroke', '#ffff00')
						.attr('stroke-width', 1)
						.attr('stroke-dasharray', '3,3');
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 10)
						.attr('fill', 'transparent')
						.attr('class', 'hotspot-hit')
						.on('mouseenter', (event: MouseEvent) => showTooltip(event, `☢ ${ns.desc}`, '#ffff00'))
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});

			// Draw military bases
			MILITARY_BASES.forEach((mb) => {
				const [x, y] = projection([mb.lon, mb.lat]) || [0, 0];
				if (x && y) {
					const starPath = `M${x},${y - 5} L${x + 1.5},${y - 1.5} L${x + 5},${y - 1.5} L${x + 2.5},${y + 1} L${x + 3.5},${y + 5} L${x},${y + 2.5} L${x - 3.5},${y + 5} L${x - 2.5},${y + 1} L${x - 5},${y - 1.5} L${x - 1.5},${y - 1.5} Z`;
					mapGroup.append('path').attr('d', starPath).attr('fill', '#ff00ff').attr('opacity', 0.8);
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 10)
						.attr('fill', 'transparent')
						.attr('class', 'hotspot-hit')
						.on('mouseenter', (event: MouseEvent) => showTooltip(event, `★ ${mb.desc}`, '#ff00ff'))
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});

			// Draw hotspots
			HOTSPOTS.forEach((h) => {
				const [x, y] = projection([h.lon, h.lat]) || [0, 0];
				if (x && y) {
					const color = THREAT_COLORS[h.level];
					// Pulsing circle
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 6)
						.attr('fill', color)
						.attr('fill-opacity', 0.3)
						.attr('class', 'pulse');
					// Inner dot
					mapGroup.append('circle').attr('cx', x).attr('cy', y).attr('r', 3).attr('fill', color);
					// Label
					mapGroup
						.append('text')
						.attr('x', x + 8)
						.attr('y', y + 3)
						.attr('fill', color)
						.attr('font-size', '8px')
						.attr('font-family', 'monospace')
						.text(h.name);
					// Hit area
					mapGroup
						.append('circle')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 12)
						.attr('fill', 'transparent')
						.attr('class', 'hotspot-hit')
						.on('mouseenter', (event: MouseEvent) =>
							showEnhancedTooltip(event, h.name, h.lat, h.lon, h.desc, color)
						)
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});

			// Draw custom monitors with locations
			drawMonitors();
			
			// Draw global news markers
			drawGlobalNews();
			
			// Draw world leaders events
			drawWorldLeadersEvents();
			
			// Draw Fed events
			drawFedEvents();
		} catch (err) {
			console.error('Failed to load map data:', err);
		}
	}

	// Draw global news markers
	function drawGlobalNews(): void {
		if (!mapGroup || !projection) return;

		// Remove existing news markers
		mapGroup.selectAll('.news-marker').remove();

		// Filter news (last 48 hours, prioritize alerts)
		const now = Date.now();
		const twoDaysAgo = now - 48 * 60 * 60 * 1000;
		const recentNews = news
			.filter((item) => item.timestamp > twoDaysAgo)
			.sort((a, b) => {
				// Prioritize alerts
				if (a.isAlert && !b.isAlert) return -1;
				if (!a.isAlert && b.isAlert) return 1;
				// Then by recency
				return b.timestamp - a.timestamp;
			})
			.slice(0, 100); // Limit to 100 markers

		// Group news by location to avoid overlapping markers
		const newsByLocation = new Map<string, NewsItem[]>();
		recentNews.forEach((item) => {
			// Try Brazilian city first
			let location = geocodeBrazilianCity(item.title);
			
			// If not Brazilian, try global location
			if (!location) {
				const region = detectRegion(item.title);
				if (region && region !== 'BRAZIL') {
					// Try to geocode by region or title
					location = geocodeGlobalLocation(item.title);
				}
			}
			
			if (location) {
				// Group by location with ~50km radius (0.5 degrees)
				const roundedLat = Math.round(location.lat * 2) / 2;
				const roundedLon = Math.round(location.lon * 2) / 2;
				const key = `${roundedLat},${roundedLon}`;
				if (!newsByLocation.has(key)) {
					newsByLocation.set(key, []);
				}
				newsByLocation.get(key)!.push(item);
			}
		});

		// Draw markers
		newsByLocation.forEach((items, key) => {
			const [lat, lon] = key.split(',').map(Number);
			const [x, y] = projection([lon, lat]) || [0, 0];
			if (x && y) {
				// Determine location name
				let locationName = 'Localização';
				const firstItem = items[0];
				const brazilianCity = geocodeBrazilianCity(firstItem.title);
				if (brazilianCity) {
					locationName = brazilianCity.name;
				} else {
					const globalLoc = geocodeGlobalLocation(firstItem.title);
					if (globalLoc) {
						locationName = globalLoc.name;
					}
				}

				// Color based on category and alerts
				const categoryColors: Record<string, string> = {
					politics: '#ff4444',
					tech: '#00aaff',
					finance: '#00ff88',
					gov: '#ffaa00',
					ai: '#aa44ff',
					intel: '#ff00ff'
				};
				const hasAlert = items.some((item) => item.isAlert);
				const baseColor = categoryColors[firstItem.category] || '#ffffff';
				const color = hasAlert ? '#ff0000' : baseColor;

				// Draw marker - larger if multiple items or alert
				const radius = items.length > 1 || hasAlert ? 5 : 4;
				const markerClass = hasAlert ? 'news-marker alert-pulse' : 'news-marker';
				mapGroup
					.append('circle')
					.attr('class', markerClass)
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', radius)
					.attr('fill', color)
					.attr('fill-opacity', hasAlert ? 1 : 0.8)
					.attr('stroke', color)
					.attr('stroke-width', hasAlert ? 2 : 1.5);

				// Show count if multiple items
				if (items.length > 1) {
					mapGroup
						.append('text')
						.attr('class', 'news-marker')
						.attr('x', x)
						.attr('y', y + 3)
						.attr('fill', color)
						.attr('font-size', '6px')
						.attr('font-family', 'monospace')
						.attr('text-anchor', 'middle')
						.attr('font-weight', 'bold')
						.text(items.length);
				}

				// Draw hit area
				mapGroup
					.append('circle')
					.attr('class', 'news-marker')
					.attr('cx', x)
					.attr('cy', y)
					.attr('r', 12)
					.attr('fill', 'transparent')
					.on('mouseenter', (event: MouseEvent) => {
						const titles = items.slice(0, 3).map((item) => item.title);
						const alertCount = items.filter((item) => item.isAlert).length;
						const tooltipTitle = alertCount > 0
							? `⚠️ ${locationName} (${alertCount} alertas)`
							: `📰 ${locationName}`;
						showTooltip(event, tooltipTitle, color, titles);
					})
					.on('mousemove', moveTooltip)
					.on('mouseleave', hideTooltip);
			}
		});
	}

	// Draw world leaders events
	function drawWorldLeadersEvents(): void {
		if (!mapGroup || !projection) return;

		// Remove existing leader markers
		mapGroup.selectAll('.leader-marker').remove();

		const now = Date.now();
		const oneDayAgo = now - 24 * 60 * 60 * 1000;

		leaders
			.filter((leader) => {
				// Only show leaders with recent news
				return leader.news && leader.news.length > 0;
			})
			.forEach((leader) => {
				// Geocode by country
				const location = geocodeCountry(leader.country);
				if (!location) return;

				const [x, y] = projection([location.lon, location.lat]) || [0, 0];
				if (x && y) {
					const newsCount = leader.news?.length || 0;
					const color = '#00aaff';

					// Draw star icon for leaders
					const starPath = `M${x},${y - 4} L${x + 1.2},${y - 1.2} L${x + 4},${y - 1.2} L${x + 2},${y + 0.8} L${x + 2.8},${y + 4} L${x},${y + 2} L${x - 2.8},${y + 4} L${x - 2},${y + 0.8} L${x - 4},${y - 1.2} L${x - 1.2},${y - 1.2} Z`;
					mapGroup
						.append('path')
						.attr('class', 'leader-marker')
						.attr('d', starPath)
						.attr('fill', color)
						.attr('fill-opacity', 0.8)
						.attr('stroke', color)
						.attr('stroke-width', 1);

					// Show news count badge
					if (newsCount > 0) {
						mapGroup
							.append('circle')
							.attr('class', 'leader-marker')
							.attr('cx', x + 3)
							.attr('cy', y - 3)
							.attr('r', 6)
							.attr('fill', '#ff4444')
							.attr('stroke', '#fff')
							.attr('stroke-width', 1);
						mapGroup
							.append('text')
							.attr('class', 'leader-marker')
							.attr('x', x + 3)
							.attr('y', y - 1)
							.attr('fill', '#fff')
							.attr('font-size', '5px')
							.attr('font-family', 'monospace')
							.attr('text-anchor', 'middle')
							.attr('font-weight', 'bold')
							.text(newsCount > 9 ? '9+' : newsCount);
					}

					// Draw hit area
					mapGroup
						.append('circle')
						.attr('class', 'leader-marker')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 12)
						.attr('fill', 'transparent')
						.on('mouseenter', (event: MouseEvent) => {
							const newsTitles = leader.news?.slice(0, 3).map((n) => n.title) || [];
							showTooltip(
								event,
								`👤 ${leader.name} - ${leader.country}`,
								color,
								[`${newsCount} notícias`, ...newsTitles]
							);
						})
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});
	}

	// Draw Fed events
	function drawFedEvents(): void {
		if (!mapGroup || !projection) return;

		// Remove existing Fed markers
		mapGroup.selectAll('.fed-marker').remove();

		const now = Date.now();
		const oneDayAgo = now - 24 * 60 * 60 * 1000;

		// Filter recent Fed news
		const recentFedNews = fedNews.filter((item) => item.timestamp > oneDayAgo);
		if (recentFedNews.length === 0) return;

		// Washington DC coordinates
		const fedLat = 38.9;
		const fedLon = -77.0;
		const [x, y] = projection([fedLon, fedLat]) || [0, 0];
		if (x && y) {
			const color = '#ffaa00';
			const hasPowell = recentFedNews.some((item) => item.isPowellRelated);

			// Draw Fed building icon (simplified)
			mapGroup
				.append('rect')
				.attr('class', 'fed-marker')
				.attr('x', x - 4)
				.attr('y', y - 4)
				.attr('width', 8)
				.attr('height', 8)
				.attr('fill', color)
				.attr('fill-opacity', 0.8)
				.attr('stroke', color)
				.attr('stroke-width', 1.5);

			// Draw Powell indicator if present
			if (hasPowell) {
				mapGroup
					.append('circle')
					.attr('class', 'fed-marker')
					.attr('cx', x + 3)
					.attr('cy', y - 3)
					.attr('r', 4)
					.attr('fill', '#ff6600')
					.attr('stroke', '#fff')
					.attr('stroke-width', 1);
			}

			// Show count badge
			if (recentFedNews.length > 1) {
				mapGroup
					.append('circle')
					.attr('class', 'fed-marker')
					.attr('cx', x + 4)
					.attr('cy', y + 4)
					.attr('r', 5)
					.attr('fill', '#ff4444')
					.attr('stroke', '#fff')
					.attr('stroke-width', 1);
				mapGroup
					.append('text')
					.attr('class', 'fed-marker')
					.attr('x', x + 4)
					.attr('y', y + 6)
					.attr('fill', '#fff')
					.attr('font-size', '5px')
					.attr('font-family', 'monospace')
					.attr('text-anchor', 'middle')
					.attr('font-weight', 'bold')
					.text(recentFedNews.length > 9 ? '9+' : recentFedNews.length);
			}

			// Draw hit area
			mapGroup
				.append('circle')
				.attr('class', 'fed-marker')
				.attr('cx', x)
				.attr('cy', y)
				.attr('r', 12)
				.attr('fill', 'transparent')
				.on('mouseenter', (event: MouseEvent) => {
					const titles = recentFedNews.slice(0, 3).map((item) => item.title);
					const powellCount = recentFedNews.filter((item) => item.isPowellRelated).length;
					const tooltipTitle = powellCount > 0
						? `🏛️ Federal Reserve (${powellCount} Powell)`
						: '🏛️ Federal Reserve';
					showTooltip(event, tooltipTitle, color, titles);
				})
				.on('mousemove', moveTooltip)
				.on('mouseleave', hideTooltip);
		}
	}

	// Draw custom monitor locations
	function drawMonitors(): void {
		if (!mapGroup || !projection) return;

		// Remove existing monitor markers
		mapGroup.selectAll('.monitor-marker').remove();

		monitors
			.filter((m) => m.enabled && m.location)
			.forEach((m) => {
				if (!m.location) return;
				const [x, y] = projection([m.location.lon, m.location.lat]) || [0, 0];
				if (x && y) {
					const color = m.color || '#00ffff';
					mapGroup
						.append('circle')
						.attr('class', 'monitor-marker')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 5)
						.attr('fill', color)
						.attr('fill-opacity', 0.6)
						.attr('stroke', color)
						.attr('stroke-width', 2);
					mapGroup
						.append('text')
						.attr('class', 'monitor-marker')
						.attr('x', x + 8)
						.attr('y', y + 3)
						.attr('fill', color)
						.attr('font-size', '8px')
						.attr('font-family', 'monospace')
						.text(m.name);
					mapGroup
						.append('circle')
						.attr('class', 'monitor-marker')
						.attr('cx', x)
						.attr('cy', y)
						.attr('r', 10)
						.attr('fill', 'transparent')
						.on('mouseenter', (event: MouseEvent) =>
							showTooltip(event, `📡 ${m.name}`, color, [
								m.location?.name || '',
								m.keywords.join(', ')
							])
						)
						.on('mousemove', moveTooltip)
						.on('mouseleave', hideTooltip);
				}
			});
	}

	// Zoom controls
	function zoomIn(): void {
		if (!svg || !zoom) return;
		svg.transition().duration(300).call(zoom.scaleBy, 1.5);
	}

	function zoomOut(): void {
		if (!svg || !zoom) return;
		svg
			.transition()
			.duration(300)
			.call(zoom.scaleBy, 1 / 1.5);
	}

	function resetZoom(): void {
		if (!svg || !zoom || !d3Module) return;
		svg.transition().duration(300).call(zoom.transform, d3Module.zoomIdentity);
	}

	// Reactively update monitors when they change
	$effect(() => {
		// Track monitors changes
		const _monitorsRef = monitors;
		if (_monitorsRef && mapGroup && projection) {
			drawMonitors();
		}
	});

	// Reactively update global news markers when news changes
	$effect(() => {
		// Track news changes
		const _newsRef = news;
		if (_newsRef && mapGroup && projection) {
			drawGlobalNews();
		}
	});

	// Reactively update leaders events when leaders change
	$effect(() => {
		// Track leaders changes
		const _leadersRef = leaders;
		if (_leadersRef && mapGroup && projection) {
			drawWorldLeadersEvents();
		}
	});

	// Reactively update Fed events when fedNews changes
	$effect(() => {
		// Track fedNews changes
		const _fedNewsRef = fedNews;
		if (_fedNewsRef && mapGroup && projection) {
			drawFedEvents();
		}
	});

	onMount(() => {
		initMap();
		
		// Setup resize observer for responsive map
		const resizeObserver = new ResizeObserver(() => {
			updateMapDimensions();
		});
		if (mapContainer) {
			resizeObserver.observe(mapContainer);
		}
		
		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<Panel id="map" title={PANELS.map.name} {loading} {error}>
	<div class="map-container" bind:this={mapContainer}>
		<svg class="map-svg"></svg>
		{#if tooltipVisible && tooltipContent}
			<div
				class="map-tooltip"
				style="left: {tooltipPosition.left}px; top: {tooltipPosition.top}px;"
			>
				<strong style="color: {tooltipContent.color}">{tooltipContent.title}</strong>
				{#each tooltipContent.lines as line}
					<br /><span class="tooltip-line">{line}</span>
				{/each}
			</div>
		{/if}
		<div class="zoom-controls">
			<button class="zoom-btn" onclick={zoomIn} title="Ampliar">+</button>
			<button class="zoom-btn" onclick={zoomOut} title="Reduzir">−</button>
			<button class="zoom-btn" onclick={resetZoom} title="Redefinir">⟲</button>
		</div>
		<div class="map-legend">
			<div class="legend-section">
				<div class="legend-item">
					<span class="legend-dot high"></span> Alto
				</div>
				<div class="legend-item">
					<span class="legend-dot elevated"></span> Elevado
				</div>
				<div class="legend-item">
					<span class="legend-dot low"></span> Baixo
				</div>
			</div>
			<div class="legend-section">
				<div class="legend-item">
					<span class="legend-icon">📰</span> Notícias
				</div>
				<div class="legend-item">
					<span class="legend-icon">👤</span> Líderes
				</div>
				<div class="legend-item">
					<span class="legend-icon">🏛️</span> Fed
				</div>
				<div class="legend-item">
					<span class="legend-icon">📡</span> Monitores
				</div>
			</div>
		</div>
	</div>
</Panel>

<style>
	.map-container {
		position: relative;
		width: 100%;
		/* Evita colapsar em layouts de coluna e melhora legibilidade */
		min-height: clamp(320px, 55vh, 720px);
		aspect-ratio: 16 / 9;
		background: #0a0f0d;
		border-radius: 4px;
		overflow: hidden;
	}

	.map-svg {
		width: 100%;
		height: 100%;
	}

	.map-tooltip {
		position: absolute;
		background: rgba(10, 10, 10, 0.95);
		border: 1px solid #333;
		border-radius: 4px;
		padding: 0.5rem;
		font-size: clamp(0.75rem, 1.8vw, 0.95rem);
		color: #ddd;
		max-width: 250px;
		pointer-events: none;
		z-index: 100;
	}

	@media (max-width: 640px) {
		.map-container {
			min-height: clamp(360px, 60vh, 640px);
			aspect-ratio: 4 / 3;
		}
		.zoom-controls {
			bottom: 0.75rem;
			right: 0.75rem;
		}
		.zoom-btn {
			width: 44px;
			height: 44px;
			font-size: 1rem;
		}
	}

	.tooltip-line {
		opacity: 0.7;
	}

	.zoom-controls {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.zoom-btn {
		width: 2.75rem;
		height: 2.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(20, 20, 20, 0.9);
		border: 1px solid #333;
		border-radius: 4px;
		color: #aaa;
		font-size: 1rem;
		cursor: pointer;
	}

	.zoom-btn:hover {
		background: rgba(40, 40, 40, 0.9);
		color: #fff;
	}

	.map-legend {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		background: rgba(10, 10, 10, 0.8);
		padding: 0.4rem 0.5rem;
		border-radius: 4px;
		font-size: 0.55rem;
	}

	.legend-section {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.legend-section:not(:last-child) {
		padding-bottom: 0.3rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: #888;
	}

	.legend-icon {
		font-size: 0.7rem;
		width: 12px;
		text-align: center;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.legend-dot.high {
		background: #ff4444;
	}

	.legend-dot.elevated {
		background: #ffcc00;
	}

	.legend-dot.low {
		background: #00ff88;
	}

	/* Pulse animation for hotspots */
	:global(.pulse) {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			r: 6;
			opacity: 0.3;
		}
		50% {
			r: 10;
			opacity: 0.1;
		}
	}

	/* Alert pulse animation for news markers */
	:global(.alert-pulse) {
		animation: alertPulse 1.5s ease-in-out infinite;
	}

	@keyframes alertPulse {
		0%,
		100% {
			opacity: 1;
			fill-opacity: 1;
		}
		50% {
			opacity: 0.7;
			fill-opacity: 0.7;
		}
	}

	:global(.hotspot-hit) {
		cursor: pointer;
	}

	/* Hide zoom controls on mobile where touch zoom is available */
	@media (max-width: 768px) {
		.zoom-controls {
			display: flex;
		}
	}
</style>
