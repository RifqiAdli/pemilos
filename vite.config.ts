import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true, // ini supaya bind ke 0.0.0.0 dan bisa diakses dari network
    port: 5173, // port default, boleh ganti
  },
});
