/**
 * Configuração de feeds RSS e fontes de notícias
 */

import type { NewsCategory } from '$lib/types';

export interface FeedSource {
	name: string;
	url: string;
}

export interface IntelSource extends FeedSource {
	type: 'think-tank' | 'defense' | 'regional' | 'osint' | 'govt' | 'cyber';
	topics: string[];
	region?: string;
}

export const FEEDS: Record<NewsCategory, FeedSource[]> = {
	politics: [
		{ name: 'G1 Mundo', url: 'https://g1.globo.com/rss/g1/mundo/' },
		{ name: 'Folha de S.Paulo - Mundo', url: 'https://feeds.folha.uol.com.br/mundo/rss091.xml' },
		{ name: 'Estadão - Internacional', url: 'https://www.estadao.com.br/internacional/rss' },
		{ name: 'BBC Brasil', url: 'https://www.bbc.com/portuguese/topics/c404v027pd4t/rss.xml' },
		{ name: 'CartaCapital', url: 'https://www.cartacapital.com.br/feed/' },
		{ name: 'Veja', url: 'https://veja.abril.com.br/feed/' },
		{ name: 'IstoÉ', url: 'https://www.istoedinheiro.com.br/feed/' },
		{ name: 'O Globo', url: 'https://oglobo.globo.com/rss.xml' },
		{ name: 'Jornal do Brasil', url: 'https://www.jb.com.br/rss/' },
		{ name: 'Correio Braziliense', url: 'https://www.correiobraziliense.com.br/rss' },
		{ name: 'Gazeta do Povo', url: 'https://www.gazetadopovo.com.br/rss/' },
		{ name: 'O Estado de S.Paulo', url: 'https://www.estadao.com.br/rss' },
		{ name: 'Zero Hora', url: 'https://gauchazh.clicrbs.com.br/rss' },
		{ name: 'Jornal do Commercio', url: 'https://www.jc.com.br/rss' },
		{ name: 'Diário do Nordeste', url: 'https://diariodonordeste.verdesmares.com.br/rss' },
		{ name: 'A Tarde', url: 'https://atarde.com.br/rss' },
		{ name: 'O Povo', url: 'https://www.opovo.com.br/rss' },
		{ name: 'Agência Pública', url: 'https://apublica.org/feed/' },
		{ name: 'CNN Brasil', url: 'https://www.cnnbrasil.com.br/feed/' },
		{ name: 'Nexo Jornal', url: 'https://www.nexojornal.com.br/api/v1/posts/feed.xml' },
		{ name: 'O Antagonista', url: 'https://oantagonista.com/feed/' },
		{ name: 'The Intercept Brasil', url: 'https://theintercept.com.br/feed/' },
		{ name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
		{ name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
		{ name: 'Guardian World', url: 'https://www.theguardian.com/world/rss' },
		{ name: 'NYT World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' }
	],
	tech: [
		{ name: 'G1 Tecnologia', url: 'https://g1.globo.com/rss/g1/tecnologia/' },
		{ name: 'Folha de S.Paulo - Tecnologia', url: 'https://feeds.folha.uol.com.br/tec/rss091.xml' },
		{ name: 'UOL Tecnologia', url: 'https://rss.uol.com.br/feed/tecnologia.xml' },
		{ name: 'Baguete', url: 'http://www.baguete.com.br/rss.php' },
		{ name: 'Canaltech', url: 'https://canaltech.com.br/rss/' },
		{ name: 'Convergência Digital', url: 'https://convergenciadigital.com.br/feed/' },
		{ name: 'TecMundo', url: 'https://www.tecmundo.com.br/rss.xml' },
		{ name: 'Olhar Digital', url: 'https://olhardigital.com.br/rss/' },
		{ name: 'TudoCelular', url: 'https://www.tudocelular.com/rss/' },
		{ name: 'TechTudo', url: 'https://www.techtudo.com.br/rss' },
		{ name: 'Gizmodo Brasil', url: 'https://gizmodo.uol.com.br/rss' },
		{ name: 'MacMagazine', url: 'https://macmagazine.com.br/sobre/rss/' },
		{ name: 'TeleSíntese', url: 'https://telesintese.com.br/feed/' },
		{ name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
		{ name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
		{ name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
		{ name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/' },
		{ name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' },
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' }
	],
	finance: [
		{ name: 'G1 Economia', url: 'https://g1.globo.com/rss/g1/economia/' },
		{ name: 'Valor Econômico', url: 'https://valor.globo.com/rss' },
		{ name: 'Folha de S.Paulo - Mercado', url: 'https://feeds.folha.uol.com.br/mercado/rss091.xml' },
		{ name: 'B3', url: 'https://www.b3.com.br/pt_br/solucoes/plataformas/puma-trading-system/rss-noticias/' },
		{ name: 'Brazil Journal', url: 'https://braziljournal.com/feed/' },
		{ name: 'Exame', url: 'https://exame.com/feed/' },
		{ name: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
		{ name: 'InvestNews', url: 'https://investnews.com.br/feed-news/?cat=negocios' },
		{ name: 'IstoÉ Dinheiro', url: 'https://www.istoedinheiro.com.br/feed/' },
		{ name: 'Investimentos e Notícias', url: 'https://investimentosenoticias.com.br/feed/' },
		{ name: 'Money Times', url: 'https://www.moneytimes.com.br/rss' },
		{ name: 'Suno Research', url: 'https://www.sunoresearch.com.br/rss' },
		{ name: 'Seu Dinheiro', url: 'https://www.seudinheiro.com/rss' },
		{ name: 'Terra Economia', url: 'https://www.terra.com.br/economia/rss.xml' },
		{ name: 'CNBC', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
		{ name: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories' },
		{ name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
		{ name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
		{ name: 'FT', url: 'https://www.ft.com/rss/home' }
	],
	gov: [
		{ name: 'G1 Política', url: 'https://g1.globo.com/rss/g1/politica/' },
		{ name: 'Folha de S.Paulo - Poder', url: 'https://feeds.folha.uol.com.br/poder/rss091.xml' },
		{ name: 'Poder360', url: 'https://www.poder360.com.br/feed/' },
		{ name: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss' },
		{ name: 'Agência Senado', url: 'https://www.senado.gov.br/rss/agenciasenado.xml' },
		{ name: 'Anatel', url: 'https://www.gov.br/anatel/pt-br/assuntos/noticias/RSS' },
		{ name: 'Banco Central', url: 'https://www.bcb.gov.br/acessoinformacao/rss' },
		{ name: 'Câmara dos Deputados - Economia', url: 'https://www.camara.leg.br/noticias/rss/dinamico/ECONOMIA' },
		{ name: 'Câmara dos Deputados - Política', url: 'https://www.camara.leg.br/noticias/rss/dinamico/POLITICA' },
		{ name: 'Câmara dos Deputados - Últimas Notícias', url: 'https://www.camara.leg.br/noticias/rss/ultimas-noticias' },
		{ name: 'Congresso em Foco', url: 'https://congressoemfoco.uol.com.br/feed/' },
		{ name: 'Metrópoles', url: 'https://www.metropoles.com/feed' },
		{ name: 'Jota', url: 'https://www.jota.info/rss' },
		{ name: 'Conjur', url: 'https://www.conjur.com.br/rss' },
		{ name: 'STJ', url: 'https://res.stj.jus.br/hrestp-c-portalp/RSS.xml' },
		{ name: 'Tesouro Nacional', url: 'https://www.gov.br/tesouronacional/pt-br/noticias/ultimas-noticias/RSS' },
		{ name: 'White House', url: 'https://www.whitehouse.gov/news/feed/' },
		{ name: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/press_all.xml' },
		{ name: 'SEC Announcements', url: 'https://www.sec.gov/news/pressreleases.rss' },
		{
			name: 'DoD News',
			url: 'https://www.defense.gov/DesktopModules/ArticleCS/RSS.ashx?max=10&ContentType=1&Site=945'
		}
	],
	ai: [
		{ name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml' },
		{ name: 'ArXiv AI', url: 'https://rss.arxiv.org/rss/cs.AI' }
	],
	intel: [
		{ name: 'CSIS', url: 'https://www.csis.org/analysis/feed' },
		{ name: 'Brookings', url: 'https://www.brookings.edu/feed/' },
		{ name: 'CERT.br', url: 'https://cert.br/rss/certbr-rss.xml' },
		{ name: 'FGV', url: 'https://portal.fgv.br/rss' },
		{ name: 'IPEA', url: 'https://www.ipea.gov.br/rss' }
	]
};

export const INTEL_SOURCES: IntelSource[] = [
	{
		name: 'CSIS',
		url: 'https://www.csis.org/analysis/feed',
		type: 'think-tank',
		topics: ['defense', 'geopolitics']
	},
	{
		name: 'Brookings',
		url: 'https://www.brookings.edu/feed/',
		type: 'think-tank',
		topics: ['policy', 'geopolitics']
	},
	{
		name: 'CFR',
		url: 'https://www.cfr.org/rss.xml',
		type: 'think-tank',
		topics: ['foreign-policy']
	},
	{
		name: 'Defense One',
		url: 'https://www.defenseone.com/rss/all/',
		type: 'defense',
		topics: ['military', 'defense']
	},
	{
		name: 'War on Rocks',
		url: 'https://warontherocks.com/feed/',
		type: 'defense',
		topics: ['military', 'strategy']
	},
	{
		name: 'Breaking Defense',
		url: 'https://breakingdefense.com/feed/',
		type: 'defense',
		topics: ['military', 'defense']
	},
	{
		name: 'The Drive War Zone',
		url: 'https://www.thedrive.com/the-war-zone/feed',
		type: 'defense',
		topics: ['military']
	},
	{
		name: 'The Diplomat',
		url: 'https://thediplomat.com/feed/',
		type: 'regional',
		topics: ['asia-pacific'],
		region: 'APAC'
	},
	{
		name: 'Al-Monitor',
		url: 'https://www.al-monitor.com/rss',
		type: 'regional',
		topics: ['middle-east'],
		region: 'MENA'
	},
	{
		name: 'Bellingcat',
		url: 'https://www.bellingcat.com/feed/',
		type: 'osint',
		topics: ['investigation', 'osint']
	},
	{
		name: 'CISA Alerts',
		url: 'https://www.cisa.gov/uscert/ncas/alerts.xml',
		type: 'cyber',
		topics: ['cyber', 'security']
	},
	{
		name: 'Krebs Security',
		url: 'https://krebsonsecurity.com/feed/',
		type: 'cyber',
		topics: ['cyber', 'security']
	},
	{
		name: 'CERT.br',
		url: 'https://cert.br/rss/certbr-rss.xml',
		type: 'cyber',
		topics: ['cyber', 'security'],
		region: 'BR'
	}
];
