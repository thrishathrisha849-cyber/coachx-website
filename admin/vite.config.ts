/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // LMS Admin UI batch — the admin app had no test infrastructure at all
  // before this; mirrors frontend/vite.config.ts's setup exactly.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
