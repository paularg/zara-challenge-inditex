import { expect, test, type Page } from '@playwright/test'

import {
  configureFixture,
  expectAccessible,
  expectFixtureAuthentication,
  expectNoHorizontalOverflow,
  monitorBrowserProblems,
  productDetails,
  productSummary,
  remoteImageOrigin,
  resetFixture,
  routeProductImages,
} from './support'

test.beforeEach(async ({ page }) => {
  await resetFixture()
  await routeProductImages(page)
})

const observeNextProductNavigation = async (page: Page) => {
  await page.evaluate(() => {
    const transitionWindow = window as typeof window & {
      originalStartViewTransition?: typeof document.startViewTransition
      productNavigationAnimations?: Promise<
        Array<{ duration: number; pseudoElement: string }>
      >
    }
    transitionWindow.originalStartViewTransition ??=
      document.startViewTransition.bind(document)
    const startViewTransition = transitionWindow.originalStartViewTransition
    transitionWindow.productNavigationAnimations = undefined

    document.startViewTransition = (update) => {
      const transition = startViewTransition(update)
      transitionWindow.productNavigationAnimations = transition.ready.then(() =>
        document.getAnimations().map((animation) => {
          const effect = animation.effect as
            (AnimationEffect & { pseudoElement?: string }) | null

          return {
            duration: Number(effect?.getTiming().duration ?? 0),
            pseudoElement: effect?.pseudoElement ?? '',
          }
        }),
      )

      return transition
    }
  })
}

const expectProductNavigationCrossfade = async (page: Page) => {
  const animations = await page.evaluate(async () => {
    const transitionWindow = window as typeof window & {
      productNavigationAnimations?: Promise<
        Array<{ duration: number; pseudoElement: string }>
      >
    }

    return transitionWindow.productNavigationAnimations
  })

  expect(animations).toEqual(
    expect.arrayContaining([
      { duration: 700, pseudoElement: '::view-transition-old(root)' },
      { duration: 700, pseudoElement: '::view-transition-new(root)' },
    ]),
  )
}

const finishAnimations = async (page: Page) => {
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    ),
  )
}

const expectOpaqueTransitionShell = async (
  page: Page,
  selector: '.catalog-shell' | '.product-shell',
) => {
  await expect(page.locator(selector).last()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )
}

test('direct Product detail preserves the reference composition and accessible reading journey @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')

  await expect(
    page.getByRole('heading', { name: 'Galaxy S24 Ultra' }),
  ).toBeVisible()
  await expect(
    page.getByRole('table', { name: 'Product specifications' }),
  ).toContainText('Snapdragon 8 Gen 3')
  await expect(page.getByText('From 1099 EUR')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeDisabled()
  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  await expectFixtureAuthentication()
  expect(problems).toEqual([])
})

test('similar Products scroll indicator stays at its start without overflow', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': {
      body: productDetails('galaxy-s24-ultra', {
        similarProducts: Array.from({ length: 5 }, (_, index) =>
          productSummary(`similar-${index + 1}`),
        ),
      }),
    },
  })
  await page.goto('/products/galaxy-s24-ultra')
  const carousel = page.getByRole('list', { name: 'Similar Items carousel' })
  await expect(carousel).toBeVisible()
  await expect(carousel.locator('li')).toHaveCount(5)
  await expect(page.locator('.carousel-thumb')).toHaveCSS(
    'transform',
    /translateX\(0px\)|matrix\(1, 0, 0, 1, 0, 0\)/,
  )
  await expectNoHorizontalOverflow(page)
  expect(problems).toEqual([])
})

test('unavailable Product configuration stays responsive and keyboard accessible @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/unavailable': {
      body: productDetails('unavailable', { storageOptions: [] }),
    },
  })
  await page.goto('/products/unavailable')
  await expect(page.getByRole('status')).toContainText(
    'Configuration unavailable',
  )
  const recovery = page.getByRole('link', { name: 'Browse Products' })
  await recovery.focus()
  await expect(recovery).toBeFocused()
  await expect(recovery).toHaveAttribute('href', '/')
  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  expect(problems).toEqual([])
})

test('Product variant configuration works by pointer and keyboard without extra requests @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')
  const initialRequests = (await expectFixtureAuthentication()).filter(
    (request) => request.path.startsWith('/products'),
  ).length

  await page.getByText('512 GB', { exact: true }).click()
  await expect(page.getByText('1199 EUR', { exact: true })).toBeVisible()
  const color = page.getByRole('radio', { name: 'Black titanium' })
  await color.focus()
  await page.keyboard.press('Enter')
  await expect(color).toBeChecked()
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled()
  expect(
    (await expectFixtureAuthentication()).filter((request) =>
      request.path.startsWith('/products'),
    ).length,
  ).toBe(initialRequests)
  expect(problems).toEqual([])
})

test('Product configuration resets after adding to the Cart and reopening the Product @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products': { body: [productSummary('galaxy-s24-ultra')] },
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')

  const storage = page.getByRole('radio', { name: '512 GB' })
  const color = page.getByRole('radio', { name: 'Black titanium' })
  await page.getByText('512 GB', { exact: true }).click()
  await color.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Add to cart' }).click()

  await page.getByRole('link', { name: 'Continue shopping' }).click()
  await page
    .getByRole('link', {
      name: 'Open Brand galaxy-s24-ultra Product galaxy-s24-ultra',
    })
    .click()

  await expect(storage).not.toBeChecked()
  await expect(color).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeDisabled()
  expect(problems).toEqual([])
})

test('BACK always links to the catalog after catalog navigation @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products': { body: [productSummary('galaxy-s24-ultra')] },
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/')
  await page
    .getByRole('link', {
      name: 'Open Brand galaxy-s24-ultra Product galaxy-s24-ultra',
    })
    .click()
  await page.getByRole('link', { name: 'Back' }).click()
  await expect(page).toHaveURL('/')
  expect(problems).toEqual([])
})

test('Product navigation crossfades on catalog, similar Product, and BACK history navigation', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products': { body: [productSummary('galaxy-s24-ultra')] },
    '/products/galaxy-s24-ultra': {
      body: productDetails('galaxy-s24-ultra', {
        similarProducts: [productSummary('next-product')],
      }),
    },
    '/products/next-product': { body: productDetails('next-product') },
  })
  await page.goto('/')
  await expectOpaqueTransitionShell(page, '.catalog-shell')

  await observeNextProductNavigation(page)
  await page
    .getByRole('link', {
      name: 'Open Brand galaxy-s24-ultra Product galaxy-s24-ultra',
    })
    .click()
  await expect(page).toHaveURL('/products/galaxy-s24-ultra')
  await expectProductNavigationCrossfade(page)
  await finishAnimations(page)
  await expectOpaqueTransitionShell(page, '.product-shell')
  await expect(page.locator('.product-content-shell').last()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )

  await observeNextProductNavigation(page)
  await page
    .getByRole('link', { name: 'Open Brand next-product Product next-product' })
    .click()
  await expect(page).toHaveURL('/products/next-product#product-heading')
  await expectProductNavigationCrossfade(page)
  await finishAnimations(page)
  await expectOpaqueTransitionShell(page, '.product-shell')
  await expect(page.locator('.product-content-shell').last()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  )

  await observeNextProductNavigation(page)
  await page.getByRole('link', { name: 'Back' }).click()
  await expect(page).toHaveURL('/products/galaxy-s24-ultra')
  await expectProductNavigationCrossfade(page)
  await finishAnimations(page)
  await expectOpaqueTransitionShell(page, '.product-shell')
  expect(problems).toEqual([])
})

test('catalog navigation from a scrolled card crossfades the viewport at the scroll origin', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  const products = Array.from({ length: 11 }, (_, index) =>
    productSummary(`catalog-product-${index + 1}`),
  )
  await configureFixture({
    '/products': { body: products },
    '/products/catalog-product-11': {
      body: productDetails('catalog-product-11'),
    },
  })
  await page.goto('/')
  const target = page.getByRole('link', {
    name: 'Open Brand catalog-product-11 Product catalog-product-11',
  })
  await target.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  await observeNextProductNavigation(page)
  await target.click()

  await expect(page).toHaveURL('/products/catalog-product-11')
  await expectProductNavigationCrossfade(page)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  expect(problems).toEqual([])
})

test('BACK falls back to the catalog from a fresh Product deep link @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products': { body: [] },
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')
  await page.getByRole('link', { name: 'Back' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByText('No Products found.')).toBeVisible()
  expect(problems).toEqual([])
})

test('similar Product navigation starts the destination at focus and scroll origin @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products/galaxy-s24-ultra': {
      body: productDetails('galaxy-s24-ultra', {
        similarProducts: [productSummary('next-product')],
      }),
    },
    '/products/next-product': { body: productDetails('next-product') },
  })
  await page.goto('/products/galaxy-s24-ultra')
  await page
    .getByRole('link', { name: 'Open Brand next-product Product next-product' })
    .click()
  await expect(page).toHaveURL('/products/next-product#product-heading')
  const heading = page.getByRole('heading', { name: 'Product next-product' })
  await expect(heading).toBeFocused()
  expect(await page.evaluate(() => scrollY)).toBe(0)
  expect(problems).toEqual([])
})

test('recoverable Product detail states keep navigation and retry available @critical', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page, [
    /404 .*missing/,
    /Failed to fetch|fetch failed/,
    /Minified React error #441/,
    /^Error$/,
  ])
  await configureFixture({
    '/products': { body: [productSummary('retry-product')] },
    '/products/retry-product': [
      { disconnect: true },
      { disconnect: true },
      { body: productDetails('retry-product') },
    ],
  })
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Continue shopping' }).click()
  await page
    .getByRole('link', {
      name: 'Open Brand retry-product Product retry-product',
    })
    .click()
  await expect(
    page.getByRole('alert').filter({ hasText: 'Product unavailable' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/',
  )
  await configureFixture({
    '/products/retry-product': {
      body: productDetails('retry-product'),
    },
  })
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(
    page.getByRole('heading', { name: 'Product retry-product' }),
  ).toBeVisible()

  await resetFixture()
  await configureFixture({
    '/products/missing': { status: 404, body: { message: 'Not found' } },
  })
  await page.goto('/products/missing')
  await expect(
    page.getByRole('heading', { name: 'Page not found' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Return to catalog' }),
  ).toBeVisible()
  expect(problems).toEqual([])
})

test('failed Product imagery preserves geometry and information @critical', async ({
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
  await configureFixture({
    '/products/galaxy-s24-ultra': { body: productDetails() },
  })
  await page.goto('/products/galaxy-s24-ultra')
  await expect(
    page.getByRole('img', { name: /Galaxy S24 Ultra image unavailable/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Galaxy S24 Ultra' }),
  ).toBeVisible()
  await expect(page.getByRole('radio', { name: '256 GB' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  expect(problems).toEqual([])
})
