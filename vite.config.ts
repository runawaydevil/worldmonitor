import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';
import { join } from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'copy-service-worker',
			writeBundle() {
				// Copiar service worker para a pasta static
				try {
					copyFileSync(
						join(process.cwd(), 'src/service-worker.ts'),
						join(process.cwd(), 'static/service-worker.js')
					);
				} catch (error) {
					console.warn('Não foi possível copiar service worker:', error);
				}
			}
		}
	],
	server: {
		host: 'localhost', // Apenas localhost, não expor na rede local
		port: 5173
	},
	build: {
		target: 'esnext',
		cssCodeSplit: true,
		minify: 'esbuild', // Usar esbuild (padrão do Vite, mais rápido que terser)
		sourcemap: false, // Desabilitar source maps em produção
		chunkSizeWarningLimit: 1000
	},
	optimizeDeps: {
		include: ['d3', 'topojson-client']
	}
});
