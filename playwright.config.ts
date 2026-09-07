import { existsSync } from 'node:fs'
import path from 'node:path'

import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://127.0.0.1:4173'
const localEdgeExecutable = path.join(
  process.cwd(),
  '.browsers',
  'Microsoft Edge.app',
  'Contents',
  'MacOS',
  'Microsoft Edge',
)
const edgeChannel = existsSync(localEdgeExecutable)
  ? { launchOptions: { executablePath: localEdgeExecutable } }
  : { channel: 'msedge' as const }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'mobile-393',
      use: { browserName: 'chromium', viewport: { width: 393, height: 852 } },
    },
    {
      name: 'tablet-834',
      use: { browserName: 'chromium', viewport: { width: 834, height: 1194 } },
    },
    {
      name: 'intermediate-768',
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'intermediate-1280',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop-1920',
      use: { browserName: 'chromium', viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'chrome-mobile-393',
      grep: /@critical/,
      use: {
        browserName: 'chromium',
        channel: 'chrome',
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: 'edge-mobile-393',
      grep: /@critical/,
      use: {
        browserName: 'chromium',
        ...edgeChannel,
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: 'firefox-mobile-393',
      grep: /@critical/,
      use: { browserName: 'firefox', viewport: { width: 393, height: 852 } },
    },
    {
      name: 'mobile-safari-iphone-15',
      grep: /@critical/,
      use: { ...devices['iPhone 15'] },
    },
  ],
  webServer: [
    {
      command: 'node e2e/fixtures/product-api-server.mjs',
      url: 'http://127.0.0.1:4174/__fixture/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command:
        'API_KEY=e2e-key E2E_PRODUCT_API_URL=http://127.0.0.1:4174/products pnpm start --hostname 127.0.0.1 --port 4173',
      url: `${baseURL}/cart`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
