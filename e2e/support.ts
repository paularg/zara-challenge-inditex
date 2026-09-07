import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

const fixtureOrigin = 'http://127.0.0.1:4174'
export const remoteImageOrigin =
  'https://prueba-tecnica-api-tienda-moviles.onrender.com'

export type FixtureOutcome = {
  body?: unknown
  contentType?: string
  disconnect?: boolean
  raw?: string
  status?: number
}

export type FixtureRequest = {
  apiKey: string | null
  method: string
  path: string
}

export const resetFixture = async () => {
  const response = await fetch(`${fixtureOrigin}/__fixture/reset`, {
    method: 'POST',
  })
  expect(response.ok).toBe(true)
}

export const configureFixture = async (
  routes: Record<string, FixtureOutcome | FixtureOutcome[]>,
) => {
  const response = await fetch(`${fixtureOrigin}/__fixture/configure`, {
    body: JSON.stringify({ routes }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  expect(response.ok).toBe(true)
}

export const fixtureRequests = async (): Promise<FixtureRequest[]> => {
  const response = await fetch(`${fixtureOrigin}/__fixture/requests`)
  return response.json() as Promise<FixtureRequest[]>
}

const productImage =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="#eee"/></svg>'

export const routeProductImages = async (page: Page, fail = false) => {
  await page.route(`${remoteImageOrigin}/images/**`, (route) =>
    fail
      ? route.abort('failed')
      : route.fulfill({
          body: productImage,
          contentType: 'image/svg+xml',
        }),
  )
}

export const productSummary = (id: string, basePrice = 100) => ({
  id,
  brand: `Brand ${id}`,
  name: `Product ${id}`,
  basePrice,
  imageUrl: `${remoteImageOrigin}/images/${id}.png`,
})

export const productDetails = (
  id = 'galaxy-s24-ultra',
  overrides: Record<string, unknown> = {},
) => ({
  id,
  brand: 'Samsung',
  name: id === 'galaxy-s24-ultra' ? 'Galaxy S24 Ultra' : `Product ${id}`,
  description: 'A flagship Product.',
  basePrice: 1099,
  specs: {
    screen: '6.8-inch AMOLED',
    resolution: '3120 x 1440 pixels',
    processor: 'Snapdragon 8 Gen 3',
    mainCamera: '200 MP',
    selfieCamera: '12 MP',
    battery: '5000 mAh',
    os: 'Android 14',
    screenRefreshRate: '120 Hz',
  },
  colorOptions: [
    {
      name: 'Blue titanium',
      hexCode: '#4d4e5f',
      imageUrl: `${remoteImageOrigin}/images/${id}-blue.png`,
    },
    {
      name: 'Black titanium',
      hexCode: '#222222',
      imageUrl: `${remoteImageOrigin}/images/${id}-black.png`,
    },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1099 },
    { capacity: '512 GB', price: 1199 },
  ],
  similarProducts: [],
  ...overrides,
})

export const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

export const expectAccessible = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

export const monitorBrowserProblems = (page: Page, allowed: RegExp[] = []) => {
  const problems: string[] = []
  const permitted = (message: string) =>
    /net::ERR_ABORTED.*[?&]_rsc=/.test(message) ||
    (message.includes('NS_BINDING_ABORTED') &&
      message.includes(`${remoteImageOrigin}/images/`)) ||
    allowed.some((pattern) => pattern.test(message))

  page.on('console', (message) => {
    if (
      ['error', 'warning'].includes(message.type()) &&
      !permitted(message.text())
    ) {
      problems.push(`console ${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => {
    if (!permitted(error.message)) problems.push(`page error: ${error.message}`)
  })
  page.on('requestfailed', (request) => {
    const message = `${request.failure()?.errorText ?? 'failed'} ${request.url()}`
    if (!permitted(message)) problems.push(`request failed: ${message}`)
  })
  page.on('response', (response) => {
    const message = `${response.status()} ${response.url()}`
    if (response.status() >= 400 && !permitted(message)) problems.push(message)
  })

  return problems
}

export const expectFixtureAuthentication = async () => {
  const requests = await fixtureRequests()
  const productRequests = requests.filter((request) =>
    request.path.startsWith('/products'),
  )
  expect(productRequests.length).toBeGreaterThan(0)
  expect(
    productRequests.every((request) => request.apiKey === 'e2e-key'),
    JSON.stringify(requests),
  ).toBe(true)
  return requests
}
