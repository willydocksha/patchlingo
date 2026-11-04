// vite + vitest config
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // relative base so the static build works on any host path
  base: './',
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
