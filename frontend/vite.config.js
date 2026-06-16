import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
<<<<<<< HEAD

export default defineConfig({
  plugins: [react()],
=======
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './src/api'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
  server: {
    port: 5173,
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://localhost:3000',
=======
        target: 'http://localhost:5000',
>>>>>>> 050d70686de07c389fe62cdcf8820253124b8856
        changeOrigin: true,
      },
    },
  },
});
