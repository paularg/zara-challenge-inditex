import { expect, test } from '@playwright/test'

import {
  configureFixture,
  expectAccessible,
  expectFixtureAuthentication,
  expectNoHorizontalOverflow,
  monitorBrowserProblems,
  productDetails,
  resetFixture,
  routeProductImages,
} from './support'

test.beforeEach(async ({ page }) => {
  await resetFixture()
  await routeProductImages(page)
})

test('public routes and header navigation work cleanly @smoke', async ({
  page,
}) => {
  const problems = monitorBrowserProblems(page)
  await configureFixture({
    '/products': { body: [] },
    '/products/shell-product': { body: productDetails('shell-product') },
  })

  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Smartphone catalog' }),
  ).toBeAttached()
  await expect(page.getByRole('link', { name: 'MBST home' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Cart/ })).toBeVisible()
  await page.getByRole('link', { name: /Cart/ }).click()
  await expect(page).toHaveURL('/cart')
  await expect(page.getByRole('heading', { name: 'Cart (0)' })).toBeVisible()

  await page.goto('/products/shell-product')
  await expect(
    page.getByRole('heading', { name: 'Product shell-product' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'MBST home' }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/unknown-route')
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('heading', { name: 'Smartphone catalog' }),
  ).toBeAttached()

  await expectAccessible(page)
  await expectNoHorizontalOverflow(page)
  await expectFixtureAuthentication()
  expect(problems).toEqual([])
})
