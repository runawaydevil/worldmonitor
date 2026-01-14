# Watchman v0.01

Dashboard de monitoramento global em tempo real.

**Versão 0.01** - Desenvolvido pelo **Grupo Murad**

## Requisitos

- Node.js 18+ ou Docker Desktop/Engine
- npm ou yarn
- Docker Compose v2 (para uso com Docker)

## Instalação e Execução

### Opção 1: Docker (Recomendado)

#### Produção

Build e execução da aplicação em container Nginx:

```bash
docker compose up --build
```

A aplicação estará disponível em `http://localhost:8947`.

Para executar em background:

```bash
docker compose up --build -d
```

Para parar os containers:

```bash
docker compose down
```

#### Desenvolvimento

Para desenvolvimento, recomenda-se usar a instalação local (veja Opção 2 abaixo) para aproveitar o hot-reload do Vite.

### Opção 2: Instalação Local

#### Instalação de Dependências

```bash
npm install
```

#### Execução em Modo de Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (ou porta alternativa se 5173 estiver ocupada).

#### Build para Produção

```bash
npm run build
```

#### Preview do Build de Produção

```bash
npm run preview
```

## Configuração

### Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto baseado em `.env.example`:

```bash
cp .env.example .env
```

Configure as seguintes variáveis (opcionais):

- `VITE_FINNHUB_API_KEY`: Chave da API Finnhub para dados de mercados
- `VITE_FRED_API_KEY`: Chave da API FRED (St. Louis Fed) para indicadores econômicos

**Importante**: Como este projeto utiliza SvelteKit com adapter-static, as variáveis `VITE_*` são embutidas no build do frontend. Não utilize chaves sensíveis em ambientes de produção pública.

### Obtenção de Chaves de API

#### Finnhub
Registre-se em https://finnhub.io/ e obtenha uma chave gratuita (60 requisições/minuto no plano gratuito).

#### FRED
Registre-se em https://fred.stlouisfed.org/docs/api/api_key.html e obtenha uma chave gratuita (requisições ilimitadas).

**Nota**: O sistema funciona sem essas chaves, porém alguns painéis (Mercados, Fed) podem não funcionar completamente.

## Estrutura do Projeto

```
src/
├── lib/
│   ├── components/     # Componentes Svelte reutilizáveis
│   ├── stores/         # Svelte stores para gerenciamento de estado
│   ├── services/       # Serviços (API clients, cache, circuit breaker)
│   ├── api/           # Clientes de API externas
│   ├── config/         # Arquivos de configuração
│   ├── analysis/       # Módulos de análise (correlação, narrativas)
│   └── i18n/           # Sistema de internacionalização
├── routes/             # Rotas SvelteKit
└── app.css             # Estilos globais
```

## Scripts Disponíveis

```bash
# Verificação de tipos TypeScript
npm run check

# Verificação de tipos em modo watch
npm run check:watch

# Execução de testes unitários
npm run test

# Execução de testes E2E
npm run test:e2e

# Verificação de lint
npm run lint

# Formatação de código
npm run format

# Análise de bundle
npm run build:analyze

# Verificação de build
npm run build:check
```

## Arquitetura Docker

O projeto inclui configuração Docker completa:

- `Dockerfile`: Multi-stage build (Node.js para build, Nginx Alpine para produção)
- `nginx.conf`: Configuração otimizada do Nginx com compressão, cache e security headers
- `docker-compose.yml`: Configuração para produção
- `.dockerignore`: Exclusão de arquivos desnecessários do contexto Docker

## Stack Tecnológico

- SvelteKit: Framework web
- TypeScript: Sistema de tipos
- Vite: Build tool e dev server
- Tailwind CSS: Framework CSS utilitário
- d3: Biblioteca para visualizações de dados
- Vitest: Framework de testes unitários
- Playwright: Framework de testes E2E
- Nginx: Servidor web para produção (Docker)

## Características

- Aplicação estática (SSG) sem necessidade de servidor backend
- Acesso a APIs externas via proxy CORS
- Service Worker registrado automaticamente em produção para suporte offline
- WebSocket implementado (requer servidor WebSocket para funcionamento completo)
- Internacionalização (i18n) em português brasileiro
- Responsivo e otimizado para mobile

## Troubleshooting

### Porta 8947 já em uso (Docker)

Se a porta 8947 estiver ocupada, edite `docker-compose.yml` e altere o mapeamento de portas:

```yaml
ports:
  - "8080:80"  # Altere 8080 para a porta desejada (80 é a porta interna do container)
```

### Variáveis de ambiente não funcionam

Lembre-se de que variáveis `VITE_*` são embutidas no build. Após alterar o `.env`, é necessário fazer rebuild:

```bash
docker compose up --build
```

### Erros de build no Docker

Certifique-se de que o Dockerfile está na raiz do projeto e que todas as dependências estão listadas no `package.json`.

## Licença

Este projeto é privado.
