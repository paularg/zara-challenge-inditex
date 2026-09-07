import { describe, expect, it, vi } from 'vitest'

import {
  ProductDataError,
  type ProductDataErrorKind,
  type ProductSpecs,
} from './contracts'
import {
  normalizeCatalog,
  normalizeProduct,
  readCatalog,
  readProduct,
} from './productDataCore'

const productPayload = (
  id: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  brand: `Brand ${id}`,
  name: `Product ${id}`,
  basePrice: Number(id) || 100,
  imageUrl: `http://images.example.com/${id}.png`,
  ...overrides,
})

const productDetailsPayload = {
  id: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  description: 'A flagship Product.',
  basePrice: 1099,
  rating: 4.8,
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
      name: 'Black titanium',
      hexCode: '#62605f',
      imageUrl: 'http://images.example.com/black.png',
      ignored: true,
    },
  ],
  storageOptions: [{ capacity: '256 GB', price: 1099 }],
  similarProducts: [productPayload('iphone-15-pro', { basePrice: 1219 })],
  ignored: true,
}

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })

const expectDataError = async (
  operation: Promise<unknown>,
  kind: ProductDataErrorKind,
) => {
  await expect(operation).rejects.toMatchObject({
    kind,
    name: 'ProductDataError',
  })
}

const expectSynchronousDataError = (
  operation: () => unknown,
  kind: ProductDataErrorKind,
) => {
  try {
    operation()
  } catch (error) {
    expect(error).toBeInstanceOf(ProductDataError)
    expect(error).toMatchObject({ kind })
    return
  }

  throw new Error(`Expected a ${kind} ProductDataError.`)
}

describe('Product catalog normalization', () => {
  it('normalizes the live array, deduplicates identities, repairs images, and keeps the first 20 unique Products', () => {
    const payload = [
      productPayload('1', {
        imageUrl: 'HTTP://images.example.com/1.png',
        unknownField: 'must not cross the seam',
      }),
      productPayload('1', { name: 'Duplicate must be ignored' }),
      ...Array.from({ length: 21 }, (_, index) =>
        productPayload(String(index + 2)),
      ),
    ]

    expect(normalizeCatalog(payload, '')).toEqual(
      Array.from({ length: 20 }, (_, index) => ({
        id: String(index + 1),
        brand: `Brand ${index + 1}`,
        name: `Product ${index + 1}`,
        basePrice: index + 1,
        imageUrl: `https://images.example.com/${index + 1}.png`,
      })),
    )
  })

  it('accepts the single Product object documented by OpenAPI', () => {
    expect(normalizeCatalog(productPayload('1'), '')).toEqual([
      {
        id: '1',
        brand: 'Brand 1',
        name: 'Product 1',
        basePrice: 1,
        imageUrl: 'https://images.example.com/1.png',
      },
    ])
  })

  it('keeps every unique search result without pagination', () => {
    const payload = Array.from({ length: 22 }, (_, index) =>
      productPayload(String(index + 1)),
    )

    expect(normalizeCatalog(payload, 'Brand')).toHaveLength(22)
  })

  it.each([
    ['an unexpected object', { unexpected: true }],
    ['a Product missing a consumed field', [productPayload('1', { name: '' })]],
  ])('rejects %s', (_label, payload) => {
    expectSynchronousDataError(
      () => normalizeCatalog(payload, ''),
      'invalid-payload',
    )
  })
})

describe('Product detail normalization', () => {
  it('normalizes the documented detail, strips unknown fields, and repairs every image URL', () => {
    expect(normalizeProduct(productDetailsPayload, 'galaxy-s24-ultra')).toEqual(
      {
        id: 'galaxy-s24-ultra',
        brand: 'Samsung',
        name: 'Galaxy S24 Ultra',
        description: 'A flagship Product.',
        basePrice: 1099,
        specs: productDetailsPayload.specs,
        colorOptions: [
          {
            name: 'Black titanium',
            hexCode: '#62605f',
            imageUrl: 'https://images.example.com/black.png',
          },
        ],
        storageOptions: [{ capacity: '256 GB', price: 1099 }],
        similarProducts: [
          {
            id: 'iphone-15-pro',
            brand: 'Brand iphone-15-pro',
            name: 'Product iphone-15-pro',
            basePrice: 1219,
            imageUrl: 'https://images.example.com/iphone-15-pro.png',
          },
        ],
      },
    )
  })

  it('keeps available optional specs and permits no storage configurations', () => {
    const partialSpecs: ProductSpecs = { ...productDetailsPayload.specs }
    delete partialSpecs.screenRefreshRate

    expect(
      normalizeProduct(
        {
          ...productDetailsPayload,
          specs: partialSpecs,
          storageOptions: [],
        },
        'galaxy-s24-ultra',
      ),
    ).toMatchObject({ specs: partialSpecs, storageOptions: [] })
  })

  it.each([
    ['a mismatched identity', { id: 'another-product' }],
    ['an empty color list', { colorOptions: [] }],
    [
      'invalid imagery',
      {
        colorOptions: [
          { ...productDetailsPayload.colorOptions[0], imageUrl: '' },
        ],
      },
    ],
    ['invalid pricing', { basePrice: Number.NaN }],
  ])('rejects %s', (_label, overrides) => {
    expectSynchronousDataError(
      () =>
        normalizeProduct(
          { ...productDetailsPayload, ...overrides },
          'galaxy-s24-ultra',
        ),
      'invalid-payload',
    )
  })
})

describe('Product catalog reader', () => {
  it('authenticates a normalized search without pagination', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([productPayload('1')]))

    await expect(
      readCatalog('Brand 1', { apiKey: 'configured-key', fetcher }),
    ).resolves.toHaveLength(1)

    const [request, options] = fetcher.mock.calls[0] ?? []
    const requestUrl = new URL(String(request))
    expect(requestUrl.searchParams.get('search')).toBe('Brand 1')
    expect(requestUrl.searchParams.has('limit')).toBe(false)
    expect(requestUrl.searchParams.has('offset')).toBe(false)
    expect(options).toMatchObject({
      headers: { 'x-api-key': 'configured-key' },
    })
  })

  it('does not request without API_KEY configuration', async () => {
    const fetcher = vi.fn<typeof fetch>()

    await expectDataError(
      readCatalog('', { apiKey: '', fetcher }),
      'configuration',
    )
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([
    ['authentication', 401, 'authentication'],
    ['server', 503, 'server'],
  ] as const)('classifies an HTTP %s failure', async (_label, status, kind) => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ message: 'failure' }, status))

    await expectDataError(
      readCatalog('', { apiKey: 'configured-key', fetcher }),
      kind,
    )
  })

  it('classifies network and malformed JSON failures', async () => {
    const networkFetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('offline'))
    const malformedFetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{', { status: 200 }))

    await expectDataError(
      readCatalog('', {
        apiKey: 'configured-key',
        fetcher: networkFetcher,
      }),
      'network',
    )
    await expectDataError(
      readCatalog('', {
        apiKey: 'configured-key',
        fetcher: malformedFetcher,
      }),
      'invalid-payload',
    )
  })

  it('does not retain a failed read as a successful result', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse([productPayload('1')]))

    await expectDataError(
      readCatalog('', { apiKey: 'configured-key', fetcher }),
      'network',
    )
    await expect(
      readCatalog('', { apiKey: 'configured-key', fetcher }),
    ).resolves.toHaveLength(1)
  })
})

describe('Product detail reader', () => {
  it('encodes the Product id and authenticates the request', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        jsonResponse({ ...productDetailsPayload, id: 'galaxy/s24 ultra' }),
      )

    await expect(
      readProduct('galaxy/s24 ultra', {
        apiKey: 'configured-key',
        fetcher,
      }),
    ).resolves.toMatchObject({ id: 'galaxy/s24 ultra' })
    expect(fetcher).toHaveBeenCalledWith(
      'https://prueba-tecnica-api-tienda-moviles.onrender.com/products/galaxy%2Fs24%20ultra',
      { headers: { 'x-api-key': 'configured-key' } },
    )
  })

  it('returns null only for a real 404', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ message: 'Not found' }, 404))

    await expect(
      readProduct('missing-product', {
        apiKey: 'configured-key',
        fetcher,
      }),
    ).resolves.toBeNull()
  })

  it('does not request without API_KEY configuration', async () => {
    const fetcher = vi.fn<typeof fetch>()

    await expectDataError(
      readProduct('product-1', { apiKey: undefined, fetcher }),
      'configuration',
    )
    expect(fetcher).not.toHaveBeenCalled()
  })

  it.each([
    [
      'authentication',
      jsonResponse({ message: 'Unauthorized' }, 401),
      'authentication',
    ],
    ['server', jsonResponse({ message: 'Unavailable' }, 503), 'server'],
    ['invalid payload', new Response('{', { status: 200 }), 'invalid-payload'],
  ] as const)('classifies a %s failure', async (_label, response, kind) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response)

    await expectDataError(
      readProduct('product-1', { apiKey: 'configured-key', fetcher }),
      kind,
    )
  })

  it('classifies a network failure', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('offline'))

    await expectDataError(
      readProduct('product-1', { apiKey: 'configured-key', fetcher }),
      'network',
    )
  })
})
