import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@mod': path.resolve(__dirname, './src/mod'),
      '@patcher': path.resolve(__dirname, './src/patcher'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },

  root: './src/ui',
  
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/ui/index.html'),
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});

