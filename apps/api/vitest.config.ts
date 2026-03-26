import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/data/**', 'src/**/*.test.ts', 'src/server.ts', 'src/index.ts'],
    },
  },
});
