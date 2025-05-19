import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      // Remove the external xlsx configuration
    },
    // Optimize build for better performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Improve chunk loading
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true
  },
  plugins: [react()],
  optimizeDeps: {
    // Include dependencies that need special handling
    include: ['react', 'react-dom', 'react-router-dom', 'xlsx']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'xlsx': path.resolve(__dirname, 'node_modules/xlsx'),
    },
  },
  // Improve dev server performance
  server: {
    hmr: {
      overlay: false
    }
  }
});