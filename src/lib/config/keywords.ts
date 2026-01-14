/**
 * Configuração de palavras-chave para alertas e categorização
 */

export const ALERT_KEYWORDS = [
	'war',
	'invasion',
	'military',
	'nuclear',
	'sanctions',
	'missile',
	'attack',
	'troops',
	'conflict',
	'strike',
	'bomb',
	'casualties',
	'ceasefire',
	'treaty',
	'nato',
	'coup',
	'martial law',
	'emergency',
	'assassination',
	'terrorist',
	'hostage',
	'evacuation'
] as const;

export type AlertKeyword = (typeof ALERT_KEYWORDS)[number];

export const REGION_KEYWORDS: Record<string, string[]> = {
	EUROPE: [
		'nato',
		'eu',
		'european',
		'ukraine',
		'russia',
		'germany',
		'france',
		'uk',
		'britain',
		'poland'
	],
	MENA: [
		'iran',
		'israel',
		'saudi',
		'syria',
		'iraq',
		'gaza',
		'lebanon',
		'yemen',
		'houthi',
		'middle east'
	],
	APAC: [
		'china',
		'taiwan',
		'japan',
		'korea',
		'indo-pacific',
		'south china sea',
		'asean',
		'philippines'
	],
	AMERICAS: ['us', 'america', 'canada', 'mexico', 'brazil', 'venezuela', 'latin'],
	AFRICA: ['africa', 'sahel', 'niger', 'sudan', 'ethiopia', 'somalia'],
	BRAZIL: [
		'brasil',
		'brazil',
		'brasileiro',
		'brasileira',
		'são paulo',
		'sao paulo',
		'rio de janeiro',
		'brasília',
		'brasilia',
		'belo horizonte',
		'curitiba',
		'porto alegre',
		'recife',
		'salvador',
		'manaus',
		'belém',
		'belem',
		'fortaleza',
		'goiânia',
		'goiania',
		'vitória',
		'vitoria',
		'florianópolis',
		'florianopolis',
		'acre',
		'alagoas',
		'amapá',
		'amapa',
		'amazonas',
		'bahia',
		'ceará',
		'ceara',
		'distrito federal',
		'espírito santo',
		'espirito santo',
		'goiás',
		'goias',
		'maranhão',
		'maranhao',
		'mato grosso',
		'mato grosso do sul',
		'minas gerais',
		'pará',
		'para',
		'paraíba',
		'parana',
		'paraná',
		'pernambuco',
		'piauí',
		'piaui',
		'rio de janeiro',
		'rio grande do norte',
		'rio grande do sul',
		'rondônia',
		'rondonia',
		'roraima',
		'santa catarina',
		'são paulo',
		'sergipe',
		'tocantins'
	]
};

export const TOPIC_KEYWORDS: Record<string, string[]> = {
	CYBER: ['cyber', 'hack', 'ransomware', 'malware', 'breach', 'apt', 'vulnerability'],
	NUCLEAR: ['nuclear', 'icbm', 'warhead', 'nonproliferation', 'uranium', 'plutonium'],
	CONFLICT: ['war', 'military', 'troops', 'invasion', 'strike', 'missile', 'combat', 'offensive'],
	INTEL: ['intelligence', 'espionage', 'spy', 'cia', 'mossad', 'fsb', 'covert'],
	DEFENSE: ['pentagon', 'dod', 'defense', 'military', 'army', 'navy', 'air force'],
	DIPLO: ['diplomat', 'embassy', 'treaty', 'sanctions', 'talks', 'summit', 'bilateral']
};

/**
 * Check if a headline contains alert keywords
 */
export function containsAlertKeyword(text: string): { isAlert: boolean; keyword?: string } {
	const lowerText = text.toLowerCase();
	for (const keyword of ALERT_KEYWORDS) {
		if (lowerText.includes(keyword)) {
			return { isAlert: true, keyword };
		}
	}
	return { isAlert: false };
}

/**
 * Detect region from text
 */
export function detectRegion(text: string): string | null {
	const lowerText = text.toLowerCase();
	
	// Priorizar detecção de Brasil
	if (REGION_KEYWORDS.BRAZIL.some((k) => lowerText.includes(k))) {
		return 'BRAZIL';
	}
	
	// Verificar outras regiões
	for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
		if (region === 'BRAZIL') continue; // Já verificado
		if (keywords.some((k) => lowerText.includes(k))) {
			return region;
		}
	}
	return null;
}

/**
 * Detect topics from text
 */
export function detectTopics(text: string): string[] {
	const lowerText = text.toLowerCase();
	const detected: string[] = [];
	for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
		if (keywords.some((k) => lowerText.includes(k))) {
			detected.push(topic);
		}
	}
	return detected;
}

/**
 * Mapeamento de cidades brasileiras para coordenadas (lat, lon)
 */
export const BRAZILIAN_CITIES: Record<string, { lat: number; lon: number; name: string }> = {
	brasília: { lat: -15.8, lon: -47.9, name: 'Brasília' },
	brasilia: { lat: -15.8, lon: -47.9, name: 'Brasília' },
	'são paulo': { lat: -23.55, lon: -46.63, name: 'São Paulo' },
	'sao paulo': { lat: -23.55, lon: -46.63, name: 'São Paulo' },
	'rio de janeiro': { lat: -22.9, lon: -43.2, name: 'Rio de Janeiro' },
	'belo horizonte': { lat: -19.9, lon: -43.9, name: 'Belo Horizonte' },
	curitiba: { lat: -25.4, lon: -49.3, name: 'Curitiba' },
	'porto alegre': { lat: -30.0, lon: -51.2, name: 'Porto Alegre' },
	recife: { lat: -8.05, lon: -34.9, name: 'Recife' },
	salvador: { lat: -12.97, lon: -38.5, name: 'Salvador' },
	manaus: { lat: -3.1, lon: -60.0, name: 'Manaus' },
	belém: { lat: -1.45, lon: -48.5, name: 'Belém' },
	belem: { lat: -1.45, lon: -48.5, name: 'Belém' },
	fortaleza: { lat: -3.72, lon: -38.52, name: 'Fortaleza' },
	goiânia: { lat: -16.68, lon: -49.25, name: 'Goiânia' },
	goiania: { lat: -16.68, lon: -49.25, name: 'Goiânia' },
	vitória: { lat: -20.32, lon: -40.34, name: 'Vitória' },
	vitoria: { lat: -20.32, lon: -40.34, name: 'Vitória' },
	florianópolis: { lat: -27.6, lon: -48.55, name: 'Florianópolis' },
	florianopolis: { lat: -27.6, lon: -48.55, name: 'Florianópolis' },
	campinas: { lat: -22.9, lon: -47.06, name: 'Campinas' },
	santos: { lat: -23.96, lon: -46.33, name: 'Santos' },
	guarulhos: { lat: -23.45, lon: -46.53, name: 'Guarulhos' },
	'rio branco': { lat: -9.97, lon: -67.81, name: 'Rio Branco' },
	maceió: { lat: -9.67, lon: -36.65, name: 'Maceió' },
	maceio: { lat: -9.67, lon: -36.65, name: 'Maceió' },
	macapá: { lat: 0.03, lon: -51.07, name: 'Macapá' },
	macapa: { lat: 0.03, lon: -51.07, name: 'Macapá' },
	'joão pessoa': { lat: -7.12, lon: -34.86, name: 'João Pessoa' },
	'joao pessoa': { lat: -7.12, lon: -34.86, name: 'João Pessoa' },
	teresina: { lat: -5.09, lon: -42.8, name: 'Teresina' },
	natal: { lat: -5.79, lon: -35.21, name: 'Natal' },
	aracaju: { lat: -10.91, lon: -37.07, name: 'Aracaju' },
	cuiabá: { lat: -15.6, lon: -56.1, name: 'Cuiabá' },
	cuiaba: { lat: -15.6, lon: -56.1, name: 'Cuiabá' },
	'campo grande': { lat: -20.44, lon: -54.65, name: 'Campo Grande' },
	'porto velho': { lat: -8.76, lon: -63.9, name: 'Porto Velho' },
	'boa vista': { lat: 2.82, lon: -60.67, name: 'Boa Vista' },
	palmas: { lat: -10.18, lon: -48.33, name: 'Palmas' }
};

/**
 * Detecta e geocodifica cidades brasileiras mencionadas no texto
 */
export function geocodeBrazilianCity(text: string): { lat: number; lon: number; name: string } | null {
	const lowerText = text.toLowerCase();
	
	// Verificar se o texto menciona Brasil
	if (!lowerText.includes('brasil') && !lowerText.includes('brazil') && !lowerText.includes('brasileiro')) {
		return null;
	}
	
	// Procurar por cidades brasileiras no texto
	for (const [cityKey, coords] of Object.entries(BRAZILIAN_CITIES)) {
		if (lowerText.includes(cityKey)) {
			return coords;
		}
	}
	
	// Se menciona Brasil mas não encontrou cidade específica, retornar Brasília como padrão
	return BRAZILIAN_CITIES.brasília;
}

/**
 * Mapeamento de cidades globais principais para coordenadas
 */
export const GLOBAL_CITIES: Record<string, { lat: number; lon: number; name: string }> = {
	// EUA
	'washington': { lat: 38.9, lon: -77.0, name: 'Washington DC' },
	'washington dc': { lat: 38.9, lon: -77.0, name: 'Washington DC' },
	'new york': { lat: 40.7, lon: -74.0, name: 'New York' },
	'nyc': { lat: 40.7, lon: -74.0, name: 'New York' },
	'los angeles': { lat: 34.05, lon: -118.24, name: 'Los Angeles' },
	'chicago': { lat: 41.88, lon: -87.63, name: 'Chicago' },
	
	// Europa
	'london': { lat: 51.5, lon: -0.12, name: 'London' },
	'paris': { lat: 48.85, lon: 2.35, name: 'Paris' },
	'berlin': { lat: 52.52, lon: 13.41, name: 'Berlin' },
	'brussels': { lat: 50.85, lon: 4.35, name: 'Brussels' },
	'rome': { lat: 41.9, lon: 12.5, name: 'Rome' },
	'madrid': { lat: 40.42, lon: -3.7, name: 'Madrid' },
	'amsterdam': { lat: 52.37, lon: 4.9, name: 'Amsterdam' },
	
	// Ásia
	'beijing': { lat: 39.9, lon: 116.4, name: 'Beijing' },
	'shanghai': { lat: 31.23, lon: 121.47, name: 'Shanghai' },
	'tokyo': { lat: 35.68, lon: 139.76, name: 'Tokyo' },
	'seoul': { lat: 37.57, lon: 126.98, name: 'Seoul' },
	'singapore': { lat: 1.35, lon: 103.82, name: 'Singapore' },
	'hong kong': { lat: 22.3, lon: 114.2, name: 'Hong Kong' },
	'taipei': { lat: 25.03, lon: 121.5, name: 'Taipei' },
	'delhi': { lat: 28.6, lon: 77.2, name: 'Delhi' },
	'mumbai': { lat: 19.1, lon: 72.9, name: 'Mumbai' },
	'bangkok': { lat: 13.76, lon: 100.5, name: 'Bangkok' },
	
	// Oriente Médio
	'tehran': { lat: 35.7, lon: 51.4, name: 'Tehran' },
	'tel aviv': { lat: 32.07, lon: 34.78, name: 'Tel Aviv' },
	'jerusalem': { lat: 31.77, lon: 35.22, name: 'Jerusalem' },
	'riyadh': { lat: 24.7, lon: 46.7, name: 'Riyadh' },
	'dubai': { lat: 25.2, lon: 55.27, name: 'Dubai' },
	'baghdad': { lat: 33.32, lon: 44.38, name: 'Baghdad' },
	
	// Outros
	'moscow': { lat: 55.75, lon: 37.6, name: 'Moscow' },
	'kyiv': { lat: 50.45, lon: 30.5, name: 'Kyiv' },
	'kiev': { lat: 50.45, lon: 30.5, name: 'Kyiv' },
	'pyongyang': { lat: 39.03, lon: 125.75, name: 'Pyongyang' },
	'sydney': { lat: -33.87, lon: 151.21, name: 'Sydney' },
	'melbourne': { lat: -37.81, lon: 144.96, name: 'Melbourne' },
	'cairo': { lat: 30.04, lon: 31.24, name: 'Cairo' },
	'johannesburg': { lat: -26.2, lon: 28.04, name: 'Johannesburg' },
	'lagos': { lat: 6.52, lon: 3.38, name: 'Lagos' },
	'buenos aires': { lat: -34.6, lon: -58.38, name: 'Buenos Aires' },
	'mexico city': { lat: 19.43, lon: -99.13, name: 'Mexico City' },
	'caracas': { lat: 10.5, lon: -66.9, name: 'Caracas' }
};

/**
 * Mapeamento de países para suas capitais
 */
export const COUNTRY_CAPITALS: Record<string, { lat: number; lon: number; name: string }> = {
	'united states': { lat: 38.9, lon: -77.0, name: 'Washington DC' },
	'usa': { lat: 38.9, lon: -77.0, name: 'Washington DC' },
	'us': { lat: 38.9, lon: -77.0, name: 'Washington DC' },
	'china': { lat: 39.9, lon: 116.4, name: 'Beijing' },
	'russia': { lat: 55.75, lon: 37.6, name: 'Moscow' },
	'united kingdom': { lat: 51.5, lon: -0.12, name: 'London' },
	'uk': { lat: 51.5, lon: -0.12, name: 'London' },
	'france': { lat: 48.85, lon: 2.35, name: 'Paris' },
	'germany': { lat: 52.52, lon: 13.41, name: 'Berlin' },
	'japan': { lat: 35.68, lon: 139.76, name: 'Tokyo' },
	'iran': { lat: 35.7, lon: 51.4, name: 'Tehran' },
	'israel': { lat: 31.77, lon: 35.22, name: 'Jerusalem' },
	'saudi arabia': { lat: 24.7, lon: 46.7, name: 'Riyadh' },
	'india': { lat: 28.6, lon: 77.2, name: 'Delhi' },
	'south korea': { lat: 37.57, lon: 126.98, name: 'Seoul' },
	'north korea': { lat: 39.03, lon: 125.75, name: 'Pyongyang' },
	'ukraine': { lat: 50.45, lon: 30.5, name: 'Kyiv' },
	'italy': { lat: 41.9, lon: 12.5, name: 'Rome' },
	'spain': { lat: 40.42, lon: -3.7, name: 'Madrid' },
	'canada': { lat: 45.42, lon: -75.7, name: 'Ottawa' },
	'australia': { lat: -35.28, lon: 149.13, name: 'Canberra' },
	'brazil': { lat: -15.8, lon: -47.9, name: 'Brasília' },
	'mexico': { lat: 19.43, lon: -99.13, name: 'Mexico City' },
	'argentina': { lat: -34.6, lon: -58.38, name: 'Buenos Aires' },
	'venezuela': { lat: 10.5, lon: -66.9, name: 'Caracas' },
	'south africa': { lat: -25.75, lon: 28.19, name: 'Pretoria' },
	'egypt': { lat: 30.04, lon: 31.24, name: 'Cairo' },
	'turkey': { lat: 39.93, lon: 32.86, name: 'Ankara' },
	'poland': { lat: 52.23, lon: 21.01, name: 'Warsaw' },
	'netherlands': { lat: 52.37, lon: 4.9, name: 'Amsterdam' },
	'belgium': { lat: 50.85, lon: 4.35, name: 'Brussels' },
	'switzerland': { lat: 46.95, lon: 7.45, name: 'Bern' },
	'sweden': { lat: 59.33, lon: 18.07, name: 'Stockholm' },
	'norway': { lat: 59.91, lon: 10.75, name: 'Oslo' },
	'denmark': { lat: 55.68, lon: 12.57, name: 'Copenhagen' },
	'greece': { lat: 37.98, lon: 23.73, name: 'Athens' },
	'portugal': { lat: 38.72, lon: -9.14, name: 'Lisbon' },
	'ireland': { lat: 53.35, lon: -6.26, name: 'Dublin' },
	'finland': { lat: 60.17, lon: 24.94, name: 'Helsinki' },
	'austria': { lat: 48.21, lon: 16.37, name: 'Vienna' },
	'czech republic': { lat: 50.09, lon: 14.42, name: 'Prague' },
	'hungary': { lat: 47.5, lon: 19.04, name: 'Budapest' },
	'romania': { lat: 44.43, lon: 26.1, name: 'Bucharest' },
	'bulgaria': { lat: 42.7, lon: 23.32, name: 'Sofia' },
	'croatia': { lat: 45.81, lon: 15.98, name: 'Zagreb' },
	'serbia': { lat: 44.79, lon: 20.45, name: 'Belgrade' },
	'pakistan': { lat: 33.68, lon: 73.05, name: 'Islamabad' },
	'bangladesh': { lat: 23.81, lon: 90.41, name: 'Dhaka' },
	'thailand': { lat: 13.76, lon: 100.5, name: 'Bangkok' },
	'vietnam': { lat: 21.03, lon: 105.85, name: 'Hanoi' },
	'indonesia': { lat: -6.21, lon: 106.85, name: 'Jakarta' },
	'philippines': { lat: 14.6, lon: 120.98, name: 'Manila' },
	'malaysia': { lat: 3.14, lon: 101.69, name: 'Kuala Lumpur' },
	'new zealand': { lat: -41.29, lon: 174.78, name: 'Wellington' },
	'chile': { lat: -33.45, lon: -70.67, name: 'Santiago' },
	'colombia': { lat: 4.71, lon: -74.07, name: 'Bogotá' },
	'peru': { lat: -12.05, lon: -77.03, name: 'Lima' },
	'ecuador': { lat: -0.18, lon: -78.47, name: 'Quito' },
	'uruguay': { lat: -34.9, lon: -56.19, name: 'Montevideo' },
	'paraguay': { lat: -25.26, lon: -57.58, name: 'Asunción' },
	'bolivia': { lat: -16.5, lon: -68.15, name: 'La Paz' }
};

/**
 * Geocodifica um país para sua capital
 */
export function geocodeCountry(countryName: string): { lat: number; lon: number; name: string } | null {
	const lowerCountry = countryName.toLowerCase().trim();
	return COUNTRY_CAPITALS[lowerCountry] || null;
}

/**
 * Geocodifica uma localização global (país ou cidade)
 */
export function geocodeGlobalLocation(text: string): { lat: number; lon: number; name: string } | null {
	const lowerText = text.toLowerCase();
	
	// Primeiro, tentar encontrar cidade global
	for (const [cityKey, coords] of Object.entries(GLOBAL_CITIES)) {
		if (lowerText.includes(cityKey)) {
			return coords;
		}
	}
	
	// Depois, tentar encontrar país
	for (const [countryKey, coords] of Object.entries(COUNTRY_CAPITALS)) {
		if (lowerText.includes(countryKey)) {
			return coords;
		}
	}
	
	return null;
}