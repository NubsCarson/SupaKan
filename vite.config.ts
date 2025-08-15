import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['lucide-react', '@remix-run/router'],
    force: true,
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  server: {
    fs: {
      strict: false,
    },
    watch: {
      usePolling: true,
    },
  },
});
