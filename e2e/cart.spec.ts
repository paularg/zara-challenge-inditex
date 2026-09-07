import { devices, expect, test, type Page } from '@playwright/test'

import {
  configureFixture,
  expectAccessible,
  expectFixtureAuthentication,
  expectNoHorizontalOverflow,
  fixtureRequests,
  monitorBrowserProblems,
  productDetails,
  remoteImageOrigin,
  resetFixture,
  routeProductImages,
} from './support'

const cartStorageKey = 'mbst-cart'

const productRequestCount = async () =>
  (await fixtureRequests()).filter((request) =>
    request.path.startsWith('/products'),
  ).length

test.beforeEach(async ({ page }) => {
  await resetFixture()
  await routeProductImages(page)
})

const addConfiguredProduct = async (
  page: Page,
  storage: '256 GB' | '512 GB' = '512 GB',
  color: 'Blue titanium' | 'Black titanium' = 'Blue titanium',
) => {
  await page.getByText(storage, { exact: true }).click()
  const colorOption = page.getByRole('radio', { name: color })
  await colorOption.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page).toHaveURL('/cart')
}

test('configured Product persists into the responsive Cart without refetching or repricing @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')
  await addConfiguredProduct(page)

  await expect(page.getByRole('heading', { name: 'Cart (1)' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('added to Cart')
  const line = page.getByRole('listitem')
  await expect(line).toContainText('512 GB | Blue titanium')
  await expect(line).toContainText('1199 EUR')
  const requestsBeforeReload = await productRequestCount()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cart (1)' })).toBeVisible()
  await expect(line).toContainText('1199 EUR')
  expect(await productRequestCount()).toBe(requestsBeforeReload)
  await expect(page.getByRole('button', { name: 'Pay' })).toBeEnabled()
  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  expect(problems).toEqual([])
})

test('Product and Cart typography uses the binding design tokens', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')
  await expect(
    page.getByRole('heading', { name: 'Galaxy S24 Ultra' }),
  ).toHaveCSS('font-size', '24px')
  await expect(page.getByText('From 1099 EUR')).toHaveCSS('font-size', '20px')
  await addConfiguredProduct(page, '256 GB', 'Black titanium')
  await expect(page.getByRole('heading', { name: 'Cart (1)' })).toHaveCSS(
    'font-size',
    '24px',
  )
  await expect(page.getByRole('listitem').getByText('1099 EUR')).toHaveCSS(
    'font-size',
    '12px',
  )
  await expect(
    page.getByRole('group', { name: 'Cart actions' }).getByText('1099 EUR'),
  ).toHaveCSS('font-size', '14px')
  expect(problems).toEqual([])
})

test('different variants of the same Product remain separate Cart lines @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')
  await addConfiguredProduct(page, '256 GB', 'Black titanium')
  await page.goto('/products/galaxy-s24-ultra')
  await addConfiguredProduct(page, '512 GB', 'Blue titanium')

  await expect(page.getByRole('heading', { name: 'Cart (2)' })).toBeVisible()
  const lines = page.getByRole('listitem')
  await expect(lines).toHaveCount(2)
  await expect(lines.nth(0)).toContainText('256 GB | Black titanium')
  await expect(lines.nth(1)).toContainText('512 GB | Blue titanium')
  await expect(page.getByRole('group', { name: 'Cart actions' })).toContainText(
    '2298 EUR',
  )
  await expectNoHorizontalOverflow(page)
  await expectFixtureAuthentication()
  expect(problems).toEqual([])
})

test('failed Cart imagery preserves the Product controls and responsive composition @critical', async ({
  page,
}) => {
  await page.unroute(`${remoteImageOrigin}/images/**`)
  await routeProductImages(page, true)
  const problems = monitorBrowserProblems(page, [
    /Failed to load resource: net::ERR_FAILED/,
    /ERR_FAILED.*\/images\//,
    /NS_ERROR_FAILURE.*\/images\//,
    /Blocked by Web Inspector.*\/images\//,
    /failed.*\/images\//i,
  ])
  const line = {
    id: JSON.stringify(['galaxy-s24-ultra', 'Blue titanium', '256 GB']),
    productId: 'galaxy-s24-ultra',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    imageUrl: `${remoteImageOrigin}/images/unavailable.png`,
    color: 'Blue titanium',
    storage: '256 GB',
    unitPrice: 1099,
    quantity: 1,
  }
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    {
      key: cartStorageKey,
      value: JSON.stringify({ state: { lines: [line] }, version: 1 }),
    },
  )
  await page.goto('/cart')
  await expect(
    page.getByRole('img', { name: /image unavailable/ }),
  ).toBeVisible()
  await expect(page.getByText('256 GB | Blue titanium')).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Remove one Galaxy/ }),
  ).toBeVisible()
  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  expect(problems).toEqual([])
})

test('malformed persisted Cart JSON recovers on first boot without browser problems @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await page.addInitScript(
    (key) => localStorage.setItem(key, '{not-json'),
    cartStorageKey,
  )
  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Cart (0)' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Continue shopping' }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? ''),
      cartStorageKey,
    ),
  ).toEqual({ state: { lines: [] }, version: 1 })
  expect(problems).toEqual([])
})

test('Mobile Safari contexts use the complete iPhone 15 profile @critical', async ({
  browser,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'mobile-safari-iphone-15',
    'This profile contract belongs to the Mobile Safari project.',
  )
  const profile = devices['iPhone 15']
  expect(profile).toMatchObject({
    deviceScaleFactor: 3,
    hasTouch: true,
    isMobile: true,
    screen: { height: 852, width: 393 },
    userAgent: expect.stringContaining('iPhone'),
  })
  expect(page.viewportSize()).toEqual(profile.viewport)
  expect(await page.evaluate(() => navigator.userAgent)).toContain('iPhone')

  const context = await browser.newContext({ ...profile })
  const restarted = await context.newPage()
  expect(restarted.viewportSize()).toEqual(profile.viewport)
  expect(await restarted.evaluate(() => navigator.userAgent)).toContain(
    'iPhone',
  )
  await context.close()
})
