import { expect, test } from '@playwright/test'

import {
  configureFixture,
  expectAccessible,
  expectFixtureAuthentication,
  expectNoHorizontalOverflow,
  monitorBrowserProblems,
  productDetails,
  productSummary,
  resetFixture,
  routeProductImages,
} from './support'

test.beforeEach(async ({ page }) => {
  await resetFixture()
  await routeProductImages(page)
})

test('catalog loads 20 Products in the reference grid and opens matching details @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  const products = Array.from({ length: 22 }, (_, index) =>
    productSummary(String(index + 1), (index + 1) * 100),
  )
  products.splice(1, 0, products[0])
  await configureFixture({
    '/products': { body: products },
    '/products/1': { body: productDetails('1') },
  })

  await page.goto('/')
  await expect(page.getByRole('status', { name: 'Catalog status' })).toHaveText(
    '20 Results',
  )
  await expect(
    page.getByRole('list', { name: 'Products' }).getByRole('listitem'),
  ).toHaveCount(20)
  await page.getByRole('link', { name: 'Open Brand 1 Product 1' }).click()
  await expect(page).toHaveURL('/products/1')
  await expect(page.getByRole('heading', { name: 'Product 1' })).toBeVisible()
  await expect(page).toHaveTitle('Product 1 | MBST Smartphone Store')

  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  await expectFixtureAuthentication()
  expect(problems).toEqual([])
})

test('Product-card hover wipes to the documented final state without moving the image @critical', async ({
  page,
  browserName,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({ '/products': { body: [productSummary('1')] } })
  await page.goto('/')

  const card = page.getByRole('link', { name: 'Open Brand 1 Product 1' })
  const image = card.getByRole('img')
  await expect(image).toBeVisible()
  const before = await image.boundingBox()
  const animatedElements = [
    card.locator('.catalog-card-wipe'),
    card.locator('.catalog-card-brand'),
    card.locator('.catalog-card-product'),
    card.locator('.catalog-card-price'),
  ]
  const durations = await Promise.all(
    animatedElements.map((element) =>
      element.evaluate((node) => getComputedStyle(node).transitionDuration),
    ),
  )
  expect(durations).toEqual(['0.3s', '0.3s', '0.3s', '0.3s'])
  const coarsePointer = await page.evaluate(
    () => matchMedia('(pointer: coarse)').matches,
  )
  if (browserName !== 'webkit' && !coarsePointer) {
    await card.hover()
    await expect(card.locator('.catalog-card-wipe')).toHaveCSS(
      'clip-path',
      /inset\((0px|0%)/,
    )
  }
  expect(await image.boundingBox()).toEqual(before)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  const duration = await card
    .locator('.catalog-card-wipe')
    .evaluate((element) => getComputedStyle(element).transitionDuration)
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001)
  expect(problems).toEqual([])
})

test('catalog recovers from an invalid payload through retry @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page, [
    /Minified React error #441/,
    /^Error$/,
  ])
  await configureFixture({
    '/products': [
      { body: { unexpected: true } },
      { body: [productSummary('recovered')] },
    ],
  })
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Continue shopping' }).click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Catalog unavailable' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByText('Product recovered')).toBeVisible()
  const requests = await expectFixtureAuthentication()
  expect(
    requests.filter((request) => request.path === '/products').length,
  ).toBeGreaterThanOrEqual(2)
  expect(problems).toEqual([])
})

test('search is shareable, refreshable, navigable, and clearable @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products': { body: [productSummary('initial')] },
    '/products?search=Samsung': { body: [productSummary('samsung')] },
  })
  await page.goto('/')
  const historyLength = await page.evaluate(() => history.length)
  const input = page.getByRole('searchbox', { name: 'Search Products' })
  await input.fill(' Samsung ')
  await expect(page).toHaveURL('/?search=Samsung')
  await expect(page.getByText('Product samsung')).toBeVisible()
  expect(await page.evaluate(() => history.length)).toBe(historyLength)

  await page.reload()
  await expect(input).toHaveValue('Samsung')
  await expect(page.getByText('Product samsung')).toBeVisible()
  await page.getByRole('button', { name: 'Clear search' }).first().click()
  await expect(page).toHaveURL('/')
  await expect(input).toBeFocused()
  await expect(page.getByText('Product initial')).toBeVisible()

  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  expect(problems).toEqual([])
})

test('search canonicalization preserves unrelated URL parameters', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products?search=Samsung': { body: [productSummary('samsung')] },
  })

  await page.goto('/?campaign=summer&search=%20Samsung%20')

  await expect(page).toHaveURL('/?campaign=summer&search=Samsung')
  await expect(
    page.getByRole('searchbox', { name: 'Search Products' }),
  ).toHaveValue('Samsung')
  await expect(page.getByText('Product samsung')).toBeVisible()
  expect(problems).toEqual([])
})
