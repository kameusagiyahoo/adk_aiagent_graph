import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/adk_aiagent_graph/',
  build: {
    outDir: 'docs',
    emptyOutDir: false,
  },
});
