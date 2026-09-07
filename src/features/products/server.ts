import 'server-only'

import { cacheLife } from 'next/cache'

import type { ProductDetails, ProductSummary } from './contracts'
import { readCatalog, readProduct } from './productDataCore'

const fixtureProductsEndpoint = process.env.E2E_PRODUCT_API_URL

const readerDependencies = () => ({
  apiKey: process.env.API_KEY,
  fetcher: fetch,
  ...(fixtureProductsEndpoint
    ? { productsEndpoint: fixtureProductsEndpoint }
    : {}),
})

const getCachedCatalog = async (query: string): Promise<ProductSummary[]> => {
  'use cache'

  const products = await readCatalog(query, readerDependencies())

  cacheLife('minutes')
  return products
}

const getCachedProduct = async (
  productId: string,
): Promise<ProductDetails | null> => {
  'use cache'

  const product = await readProduct(productId, readerDependencies())

  cacheLife('minutes')
  return product
}

export const getCatalog = async (query: string): Promise<ProductSummary[]> => {
  const normalizedQuery = query.trim()

  return fixtureProductsEndpoint
    ? readCatalog(normalizedQuery, readerDependencies())
    : getCachedCatalog(normalizedQuery)
}

export const getProduct = async (
  productId: string,
): Promise<ProductDetails | null> =>
  fixtureProductsEndpoint
    ? readProduct(productId, readerDependencies())
    : getCachedProduct(productId)
