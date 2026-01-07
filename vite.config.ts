import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  root: '.',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: 'index.html'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // Proxy para webhook n8n - contorna CORS em desenvolvimento
      '/api/whatsapp': {
        target: 'https://zedasafra.app.n8n.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whatsapp/, '/webhook'),
        secure: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
  }
});
