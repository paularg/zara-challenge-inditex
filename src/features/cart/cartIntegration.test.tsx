import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CartIndicator } from '@/components/shared/CartIndicator'

import { CartExperience } from './CartExperience'
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  hydrateCart,
  useCartStore,
} from './cartStore'
import { addCartLine, type CartLineInput } from './cartRules'

const variant: CartLineInput = {
  productId: 'galaxy-s24-ultra',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  imageUrl: 'https://example.com/galaxy.png',
  color: 'Blue titanium',
  storage: '256 GB',
  unitPrice: 1099,
}

beforeEach(() => {
  useCartStore.setState({ lines: [], hasHydrated: false, announcement: '' })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Cart hydration and interaction', () => {
  it('clears announcements after ten seconds and restarts the timer', () => {
    vi.useFakeTimers()

    useCartStore.getState().announce('First announcement.')
    act(() => vi.advanceTimersByTime(9_000))
    expect(useCartStore.getState().announcement).toBe('First announcement.')

    useCartStore.getState().announce('Second announcement.')
    act(() => vi.advanceTimersByTime(1_000))
    expect(useCartStore.getState().announcement).toBe('Second announcement.')

    act(() => vi.advanceTimersByTime(9_000))
    expect(useCartStore.getState().announcement).toBe('')
  })

  it('shows deterministic loading then restores version 1 and synchronizes the indicator', async () => {
    const lines = addCartLine([], variant)
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ state: { lines }, version: CART_STORAGE_VERSION }),
    )
    render(
      <>
        <CartIndicator />
        <CartExperience />
      </>,
    )

    expect(
      screen.getByRole('link', { name: 'Cart, loading' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading Cart')

    await act(() => hydrateCart())
    expect(
      screen.getByRole('link', { name: 'Cart, 1 item' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Cart (1)' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('1099 EUR')).toHaveLength(2)
  })

  it('repairs corrupt persistence to an empty current-version Cart', async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{broken')
    await act(() => hydrateCart())
    expect(useCartStore.getState()).toMatchObject({
      hasHydrated: true,
      lines: [],
    })
    expect(
      JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) ?? ''),
    ).toEqual({
      state: { lines: [] },
      version: CART_STORAGE_VERSION,
    })
  })

  it('decrements, removes, totals, and announces each Cart change', async () => {
    const user = userEvent.setup()
    const lines = addCartLine(addCartLine([], variant), variant)
    useCartStore.setState({ lines, hasHydrated: true, announcement: '' })
    render(<CartExperience />)

    expect(screen.getByText('2198 EUR')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: 'Remove one Galaxy S24 Ultra from Cart',
      }),
    )
    expect(screen.getByText('QTY: 1')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Removed one Galaxy S24 Ultra from Cart. 1 unit remains.',
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Remove one Galaxy S24 Ultra from Cart',
      }),
    )
    expect(
      screen.getByRole('heading', { name: 'Cart (0)' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Removed Galaxy S24 Ultra from Cart. Cart is empty.',
    )
  })
})
