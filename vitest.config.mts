import { defineConfig } from 'vitest/config'

const serverOnlyTestModule = new URL(
  './src/test/server-only.ts',
  import.meta.url,
).pathname

export default defineConfig({
  resolve: {
    alias: {
      'server-only': serverOnlyTestModule,
    },
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.tsx'],
  },
})
