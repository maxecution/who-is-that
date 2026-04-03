import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@web': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.ts', 'src/data/**', 'src/types/**', 'src/**/*.test.ts', 'src/test/**'],
    },
  },
});
