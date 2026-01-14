/**
 * Traduções em Português (Brasil)
 * Este arquivo será preenchido conforme traduzimos o sistema
 */

export interface Translations {
	common: {
		loading: string;
		error: string;
		save: string;
		cancel: string;
		delete: string;
		edit: string;
		close: string;
		refresh: string;
		settings: string;
		search: string;
		filter: string;
		clear: string;
		back: string;
		next: string;
		previous: string;
		confirm: string;
		yes: string;
		no: string;
		ok: string;
	};
	header: {
		title: string;
		settings: string;
	};
	panels: {
		map: string;
		politics: string;
		tech: string;
		finance: string;
		gov: string;
		heatmap: string;
		markets: string;
		monitors: string;
		commodities: string;
		crypto: string;
		polymarket: string;
		mainchar: string;
		printer: string;
		contracts: string;
		ai: string;
		layoffs: string;
		venezuela: string;
		greenland: string;
		iran: string;
		leaders: string;
		intel: string;
		correlation: string;
		narrative: string;
		fed: string;
	};
	news: {
		title: string;
		noItems: string;
		loading: string;
		error: string;
		readMore: string;
		source: string;
		published: string;
		alert: string;
	};
	markets: {
		title: string;
		price: string;
		change: string;
		changePercent: string;
		loading: string;
		error: string;
	};
	settings: {
		title: string;
		panels: string;
		general: string;
		appearance: string;
		language: string;
		save: string;
		reset: string;
	};
	onboarding: {
		welcome: string;
		subtitle: string;
		skip: string;
		hint: string;
	};
	monitors: {
		title: string;
		create: string;
		edit: string;
		delete: string;
		name: string;
		keywords: string;
		enabled: string;
		disabled: string;
		noMatches: string;
		matches: string;
	};
	errors: {
		network: string;
		timeout: string;
		unknown: string;
		circuitOpen: string;
	};
	[key: string]: any;
}

const translations: Translations = {
	common: {
		loading: 'Carregando...',
		error: 'Erro',
		save: 'Salvar',
		cancel: 'Cancelar',
		delete: 'Excluir',
		edit: 'Editar',
		close: 'Fechar',
		refresh: 'Atualizar',
		settings: 'Configurações',
		search: 'Buscar',
		filter: 'Filtrar',
		clear: 'Limpar',
		back: 'Voltar',
		next: 'Próximo',
		previous: 'Anterior',
		confirm: 'Confirmar',
		yes: 'Sim',
		no: 'Não',
		ok: 'OK'
	},
	header: {
		title: 'WATCHMAN',
		settings: 'Configurações'
	},
	panels: {
		map: 'Mapa Global',
		politics: 'Mundo / Geopolítica',
		tech: 'Tecnologia / IA',
		finance: 'Financeiro',
		gov: 'Governo / Política',
		heatmap: 'Mapa de Calor de Setores',
		markets: 'Mercados',
		monitors: 'Meus Monitores',
		commodities: 'Commodities / VIX',
		crypto: 'Criptomoedas',
		polymarket: 'Polymarket',
		mainchar: 'Personagem Principal',
		printer: 'Impressora de Dinheiro',
		contracts: 'Contratos Gov',
		ai: 'Corrida Armamentista de IA',
		layoffs: 'Rastreador de Demissões',
		venezuela: 'Situação Venezuela',
		greenland: 'Situação Groenlândia',
		iran: 'Situação Irã',
		leaders: 'Líderes Mundiais',
		intel: 'Feed de Inteligência',
		correlation: 'Motor de Correlação',
		narrative: 'Rastreador de Narrativas',
		fed: 'Federal Reserve'
	},
	news: {
		title: 'Notícias',
		noItems: 'Nenhuma notícia disponível',
		loading: 'Carregando notícias...',
		error: 'Erro ao carregar notícias',
		readMore: 'Ler mais',
		source: 'Fonte',
		published: 'Publicado',
		alert: 'Alerta'
	},
	markets: {
		title: 'Mercados',
		price: 'Preço',
		change: 'Mudança',
		changePercent: 'Mudança %',
		loading: 'Carregando dados de mercado...',
		error: 'Erro ao carregar dados de mercado'
	},
	settings: {
		title: 'Configurações',
		panels: 'Painéis',
		general: 'Geral',
		appearance: 'Aparência',
		language: 'Idioma',
		save: 'Salvar',
		reset: 'Redefinir'
	},
	onboarding: {
		welcome: 'Bem-vindo ao Watchman',
		subtitle: 'Escolha uma configuração de dashboard para começar',
		skip: 'Pular onboarding',
		hint: 'Você pode alterar isso depois nas Configurações'
	},
	monitors: {
		title: 'Monitores',
		create: 'Criar Monitor',
		edit: 'Editar Monitor',
		delete: 'Excluir Monitor',
		name: 'Nome',
		keywords: 'Palavras-chave',
		enabled: 'Habilitado',
		disabled: 'Desabilitado',
		noMatches: 'Nenhuma correspondência',
		matches: 'Correspondências'
	},
	errors: {
		network: 'Erro de rede',
		timeout: 'Tempo esgotado',
		unknown: 'Erro desconhecido',
		circuitOpen: 'Serviço temporariamente indisponível'
	}
};

export default translations;
