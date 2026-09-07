import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProductImage } from './ProductImage'

describe('ProductImage', () => {
  it('replaces a failed image with an accessible fallback', () => {
    render(
      <ProductImage
        alt="Samsung Galaxy"
        sizes="100px"
        src="https://example.com/product.png"
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Samsung Galaxy' }))
    expect(
      screen.getByRole('img', { name: 'Samsung Galaxy image unavailable' }),
    ).toHaveTextContent('Image unavailable')
  })
})
