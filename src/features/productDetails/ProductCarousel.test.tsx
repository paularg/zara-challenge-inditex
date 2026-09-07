import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProductCarousel } from './ProductCarousel'

describe('ProductCarousel', () => {
  it('scrolls immediately with the keyboard and updates its thumb', () => {
    render(
      <ProductCarousel>
        <li>One</li>
        <li>Two</li>
      </ProductCarousel>,
    )

    const carousel = screen.getByRole('list', {
      name: 'Similar Items carousel',
    })
    const scrollBy = vi.fn()
    Object.defineProperties(carousel, {
      clientWidth: { configurable: true, value: 400 },
      scrollLeft: { configurable: true, value: 300, writable: true },
      scrollWidth: { configurable: true, value: 1000 },
      scrollBy: { configurable: true, value: scrollBy },
    })
    const track = carousel.nextElementSibling as HTMLElement
    const thumb = track.firstElementChild as HTMLElement
    Object.defineProperties(track, {
      clientWidth: { configurable: true, value: 200 },
    })
    Object.defineProperties(thumb, {
      offsetWidth: { configurable: true, value: 50 },
    })

    fireEvent.keyDown(carousel, { key: 'ArrowRight' })
    expect(scrollBy).toHaveBeenCalledWith({ behavior: 'auto', left: 344 })
    fireEvent.scroll(carousel)
    expect(thumb).toHaveStyle({ transform: 'translateX(75px)' })
  })
})
