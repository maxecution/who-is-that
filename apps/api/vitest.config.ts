import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/data/**', 'src/**/*.test.ts', 'src/server.ts'],
    },
  },
});
