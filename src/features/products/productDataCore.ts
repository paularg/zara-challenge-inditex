import 'server-only'

import {
  ProductDataError,
  type ProductDetails,
  type ProductSpecs,
  type ProductSummary,
} from './contracts'

export const DEFAULT_PRODUCTS_ENDPOINT =
  'https://prueba-tecnica-api-tienda-moviles.onrender.com/products'
const INITIAL_CATALOG_LIMIT = 20

type ProductReaderDependencies = {
  apiKey: string | undefined
  fetcher: typeof fetch
  productsEndpoint?: string
}

const errorMessages = {
  catalog: {
    authentication: 'The Product catalog could not be authenticated.',
    invalidPayload: 'The Product catalog response is invalid.',
    network: 'Check your connection and try loading the catalog again.',
    server: 'The Product catalog could not be loaded.',
  },
  configuration: 'API_KEY is not configured. Add it to the local .env file.',
  product: {
    authentication: 'The Product detail could not be authenticated.',
    invalidPayload: 'The Product detail response is invalid.',
    network: 'Check your connection and try loading the Product again.',
    server: 'The Product detail could not be loaded.',
  },
} as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const repairImageUrl = (imageUrl: string) =>
  imageUrl.replace(/^http:\/\//i, 'https://')

const normalizeProductSummary = (value: unknown): ProductSummary | null => {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.brand) ||
    !isNonEmptyString(value.name) ||
    !isFiniteNumber(value.basePrice) ||
    !isNonEmptyString(value.imageUrl)
  ) {
    return null
  }

  return {
    id: value.id,
    brand: value.brand,
    name: value.name,
    basePrice: value.basePrice,
    imageUrl: repairImageUrl(value.imageUrl),
  }
}

export const normalizeCatalog = (
  payload: unknown,
  query: string,
): ProductSummary[] => {
  const payloads = Array.isArray(payload) ? payload : [payload]
  const products = payloads.map(normalizeProductSummary)

  if (products.some((product) => product === null)) {
    throw new ProductDataError(
      'invalid-payload',
      errorMessages.catalog.invalidPayload,
    )
  }

  const productIds = new Set<string>()
  const uniqueProducts: ProductSummary[] = []

  for (const product of products) {
    if (product === null || productIds.has(product.id)) {
      continue
    }

    productIds.add(product.id)
    uniqueProducts.push(product)

    if (!query && uniqueProducts.length === INITIAL_CATALOG_LIMIT) {
      break
    }
  }

  return uniqueProducts
}

const specsKeys = [
  'screen',
  'resolution',
  'processor',
  'mainCamera',
  'selfieCamera',
  'battery',
  'os',
  'screenRefreshRate',
] as const

const normalizeProductSpecs = (value: unknown): ProductSpecs | null => {
  if (!isRecord(value)) {
    return null
  }

  const specs: ProductSpecs = {}

  for (const key of specsKeys) {
    const specification = value[key]

    if (specification === undefined) {
      continue
    }

    if (!isNonEmptyString(specification)) {
      return null
    }

    specs[key] = specification
  }

  return specs
}

const invalidProductPayload = (): never => {
  throw new ProductDataError(
    'invalid-payload',
    errorMessages.product.invalidPayload,
  )
}

export const normalizeProduct = (
  payload: unknown,
  productId: string,
): ProductDetails => {
  const specs = isRecord(payload) ? normalizeProductSpecs(payload.specs) : null

  if (
    !isRecord(payload) ||
    !isNonEmptyString(payload.id) ||
    payload.id !== productId ||
    !isNonEmptyString(payload.brand) ||
    !isNonEmptyString(payload.name) ||
    !isNonEmptyString(payload.description) ||
    !isFiniteNumber(payload.basePrice) ||
    specs === null ||
    !Array.isArray(payload.colorOptions) ||
    payload.colorOptions.length === 0 ||
    !Array.isArray(payload.storageOptions) ||
    !Array.isArray(payload.similarProducts)
  ) {
    return invalidProductPayload()
  }

  const colorOptions = payload.colorOptions.map((color) => {
    if (
      !isRecord(color) ||
      !isNonEmptyString(color.name) ||
      !isNonEmptyString(color.hexCode) ||
      !isNonEmptyString(color.imageUrl)
    ) {
      return null
    }

    return {
      name: color.name,
      hexCode: color.hexCode,
      imageUrl: repairImageUrl(color.imageUrl),
    }
  })
  const storageOptions = payload.storageOptions.map((storage) => {
    if (
      !isRecord(storage) ||
      !isNonEmptyString(storage.capacity) ||
      !isFiniteNumber(storage.price)
    ) {
      return null
    }

    return { capacity: storage.capacity, price: storage.price }
  })
  const similarProducts = payload.similarProducts.map(normalizeProductSummary)

  if (
    colorOptions.some((color) => color === null) ||
    storageOptions.some((storage) => storage === null) ||
    similarProducts.some((product) => product === null)
  ) {
    return invalidProductPayload()
  }

  return {
    id: payload.id,
    brand: payload.brand,
    name: payload.name,
    description: payload.description,
    basePrice: payload.basePrice,
    specs,
    colorOptions: colorOptions.filter((color) => color !== null),
    storageOptions: storageOptions.filter((storage) => storage !== null),
    similarProducts: similarProducts.filter((product) => product !== null),
  }
}

const requireApiKey = (apiKey: string | undefined) => {
  if (!apiKey) {
    throw new ProductDataError('configuration', errorMessages.configuration)
  }

  return apiKey
}

const parseJson = async (
  response: Response,
  invalidPayloadMessage: string,
): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    throw new ProductDataError('invalid-payload', invalidPayloadMessage)
  }
}

export const readCatalog = async (
  query: string,
  {
    apiKey,
    fetcher,
    productsEndpoint = DEFAULT_PRODUCTS_ENDPOINT,
  }: ProductReaderDependencies,
): Promise<ProductSummary[]> => {
  const requestUrl = new URL(productsEndpoint)

  if (query) {
    requestUrl.searchParams.set('search', query)
  }

  let response: Response

  try {
    response = await fetcher(requestUrl, {
      headers: { 'x-api-key': requireApiKey(apiKey) },
    })
  } catch (error) {
    if (error instanceof ProductDataError) {
      throw error
    }

    throw new ProductDataError('network', errorMessages.catalog.network)
  }

  if (response.status === 401) {
    throw new ProductDataError(
      'authentication',
      errorMessages.catalog.authentication,
    )
  }

  if (!response.ok) {
    throw new ProductDataError('server', errorMessages.catalog.server)
  }

  return normalizeCatalog(
    await parseJson(response, errorMessages.catalog.invalidPayload),
    query,
  )
}

export const readProduct = async (
  productId: string,
  {
    apiKey,
    fetcher,
    productsEndpoint = DEFAULT_PRODUCTS_ENDPOINT,
  }: ProductReaderDependencies,
): Promise<ProductDetails | null> => {
  let response: Response

  try {
    response = await fetcher(
      `${productsEndpoint}/${encodeURIComponent(productId)}`,
      { headers: { 'x-api-key': requireApiKey(apiKey) } },
    )
  } catch (error) {
    if (error instanceof ProductDataError) {
      throw error
    }

    throw new ProductDataError('network', errorMessages.product.network)
  }

  if (response.status === 401) {
    throw new ProductDataError(
      'authentication',
      errorMessages.product.authentication,
    )
  }

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new ProductDataError('server', errorMessages.product.server)
  }

  return normalizeProduct(
    await parseJson(response, errorMessages.product.invalidPayload),
    productId,
  )
}
