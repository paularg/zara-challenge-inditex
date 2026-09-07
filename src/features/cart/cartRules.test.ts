import { describe, expect, it } from 'vitest'

import {
  addCartLine,
  createCartLineId,
  decrementCartLine,
  normalizePersistedCartStorageValue,
  restoreCartLines,
  selectCartTotal,
  selectCartUnitCount,
  type CartLineInput,
} from './cartRules'

const galaxyVariant = (overrides: Partial<CartLineInput> = {}) => ({
  productId: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  imageUrl: 'https://images.example.com/galaxy-blue.png',
  color: 'Blue titanium',
  storage: '256 GB',
  unitPrice: 1099,
  ...overrides,
})

const validLine = () => addCartLine([], galaxyVariant())[0]
const persistedLine = (overrides: Record<string, unknown>) => ({
  lines: [{ ...validLine(), ...overrides }],
})

describe('Cart line rules', () => {
  it('identifies a Product variant by Product, color, and storage only', () => {
    expect(createCartLineId(galaxyVariant())).toBe(
      createCartLineId(
        galaxyVariant({
          brand: 'Samsung Mobile',
          imageUrl: 'https://images.example.com/refreshed.png',
          name: 'Galaxy S24 Ultra 5G',
          unitPrice: 1299,
        }),
      ),
    )
  })

  it.each([
    ['Product', { productId: 'galaxy-s24-plus' }],
    ['color', { color: 'Black titanium' }],
    ['storage', { storage: '512 GB' }],
  ])('keeps a different %s as a distinct Cart line', (_field, difference) => {
    const lines = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(difference),
    )
    expect(lines).toHaveLength(2)
  })

  it('merges an exact repeat while retaining captured values', () => {
    const original = galaxyVariant()
    const lines = addCartLine(
      addCartLine([], original),
      galaxyVariant({
        unitPrice: 1299,
        imageUrl: 'https://example.com/new.png',
      }),
    )
    expect(lines).toEqual([
      expect.objectContaining({
        imageUrl: original.imageUrl,
        quantity: 2,
        unitPrice: original.unitPrice,
      }),
    ])
  })

  it('sums every Cart line quantity for the unit count', () => {
    const repeated = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(),
    )
    const lines = addCartLine(
      repeated,
      galaxyVariant({ storage: '512 GB', unitPrice: 1199 }),
    )
    expect(selectCartUnitCount({ lines })).toBe(3)
  })

  it('totals captured unit price multiplied by quantity', () => {
    const repeated = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(),
    )
    const lines = addCartLine(
      repeated,
      galaxyVariant({ storage: '512 GB', unitPrice: 1199 }),
    )
    expect(selectCartTotal({ lines })).toBe(3397)
  })

  it('decrements exactly one unit from the matching line', () => {
    const repeated = addCartLine(
      addCartLine([], galaxyVariant()),
      galaxyVariant(),
    )
    expect(decrementCartLine(repeated, repeated[0].id)).toEqual([
      { ...repeated[0], quantity: 1 },
    ])
  })

  it('removes a line when its quantity reaches zero', () => {
    const single = validLine()
    expect(decrementCartLine([single], single.id)).toEqual([])
  })
})

describe('Cart hydration rules', () => {
  it('restores valid captured Cart lines', () => {
    const lines = addCartLine([], galaxyVariant())
    expect(restoreCartLines({ lines })).toEqual(lines)
  })

  it.each([
    ['id', { id: '' }],
    ['Product id', { productId: '' }],
    ['brand', { brand: '' }],
    ['name', { name: '' }],
    ['image URL', { imageUrl: '' }],
    ['color', { color: '' }],
    ['storage', { storage: '' }],
  ])('rejects a line without a valid %s', (_field, invalidValue) => {
    expect(restoreCartLines(persistedLine(invalidValue))).toEqual([])
  })

  it.each([
    ['a negative price', -1],
    ['a non-finite price', Number.POSITIVE_INFINITY],
    ['a non-numeric price', '1099'],
  ])('rejects a line with %s', (_label, unitPrice) => {
    expect(restoreCartLines(persistedLine({ unitPrice }))).toEqual([])
  })

  it.each([
    ['zero', 0],
    ['a fraction', 1.5],
    ['an unsafe integer', Number.MAX_SAFE_INTEGER + 1],
    ['a non-numeric value', '1'],
  ])('rejects a line with %s as its quantity', (_label, quantity) => {
    expect(restoreCartLines(persistedLine({ quantity }))).toEqual([])
  })

  it.each([
    ['a non-object value', null],
    ['a missing lines array', {}],
    ['a non-array lines value', { lines: 'invalid' }],
    ['a forged identity', persistedLine({ id: 'forged-line-id' })],
    ['duplicate variants', { lines: [validLine(), validLine()] }],
  ])('rejects %s as an empty Cart', (_label, persistedState) => {
    expect(restoreCartLines(persistedState)).toEqual([])
  })
})

describe('Cart persistence rules', () => {
  const storageVersion = 1
  const emptyPersistedCart = JSON.stringify({
    state: { lines: [] },
    version: storageVersion,
  })

  it('keeps a valid persisted Cart available for hydration', () => {
    const storedValue = JSON.stringify({
      state: { lines: [validLine()] },
      version: storageVersion,
    })
    expect(
      normalizePersistedCartStorageValue(storedValue, storageVersion),
    ).toBe(storedValue)
  })

  it.each([
    ['malformed JSON', '{not-json'],
    [
      'an unsupported version',
      JSON.stringify({ state: { lines: [validLine()] }, version: 2 }),
    ],
    [
      'structurally invalid lines',
      JSON.stringify({
        state: persistedLine({ quantity: 0 }),
        version: storageVersion,
      }),
    ],
  ])(
    'normalizes %s to an empty current-version Cart',
    (_label, storedValue) => {
      expect(
        normalizePersistedCartStorageValue(storedValue, storageVersion),
      ).toBe(emptyPersistedCart)
    },
  )
})
