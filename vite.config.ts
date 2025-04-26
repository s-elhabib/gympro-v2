import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["xlsx"],
    },
  },
  plugins: [react()],
  optimizeDeps: {
    // Remove the exclude for lucide-react to fix loading issues
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});