import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 👈 Add this line to fix relative path issues
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
