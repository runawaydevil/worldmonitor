#
# Watchman - Dockerfile (multi-stage)
#
# Stage 1: build (SvelteKit static build)
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build-time envs (NOTE: for Vite, these get baked into the static build)
ARG VITE_FINNHUB_API_KEY
ARG VITE_FRED_API_KEY
ARG VITE_APP_DOMAIN=localhost
ENV VITE_FINNHUB_API_KEY=$VITE_FINNHUB_API_KEY
ENV VITE_FRED_API_KEY=$VITE_FRED_API_KEY
ENV VITE_APP_DOMAIN=$VITE_APP_DOMAIN

RUN npm run build

# Stage 2: run (nginx static)
FROM nginx:1.27-alpine AS runner

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static output (adapter-static outputs to build/)
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
