import { describe, expect, it } from 'vitest'

import type { ProductConfiguratorData } from './productVariant'
import { createProductVariant } from './productVariant'

const product: ProductConfiguratorData = {
  id: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  basePrice: 1099,
  colorOptions: [
    {
      name: 'Blue titanium',
      hexCode: '#4d4e5f',
      imageUrl: 'https://example.com/blue.png',
    },
  ],
  storageOptions: [{ capacity: '512 GB', price: 1199 }],
}

describe('Product variant contract', () => {
  it('captures the selected image, color, storage, and final storage price', () => {
    expect(
      createProductVariant(
        product,
        product.colorOptions[0],
        product.storageOptions[0],
      ),
    ).toEqual({
      productId: 'galaxy-s24-ultra',
      brand: 'Samsung',
      name: 'Galaxy S24 Ultra',
      imageUrl: 'https://example.com/blue.png',
      color: 'Blue titanium',
      storage: '512 GB',
      unitPrice: 1199,
    })
  })

  it('does not create a variant until color and storage are selected', () => {
    expect(createProductVariant(product, null, product.storageOptions[0])).toBe(
      null,
    )
    expect(createProductVariant(product, product.colorOptions[0], null)).toBe(
      null,
    )
  })
})
