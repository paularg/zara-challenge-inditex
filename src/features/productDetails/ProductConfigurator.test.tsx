import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCartStore } from '@/features/cart/cartStore'

import { ProductConfigurator } from './ProductConfigurator'

const push = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
    transitionTypes?: string[]
  }) => {
    const linkProps = { ...props }
    delete linkProps.transitionTypes
    return (
      <a href={href} {...linkProps}>
        {children}
      </a>
    )
  },
}))

const product = {
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
    {
      name: 'Black titanium',
      hexCode: '#000000',
      imageUrl: 'https://example.com/black.png',
    },
  ],
  storageOptions: [
    { capacity: '256 GB', price: 1099 },
    { capacity: '512 GB', price: 1199 },
  ],
}

beforeEach(() => {
  push.mockReset()
  useCartStore.setState({ lines: [], hasHydrated: true, announcement: '' })
})

describe('ProductConfigurator', () => {
  it('requires both options and captures color image plus storage final price', async () => {
    const user = userEvent.setup()
    render(<ProductConfigurator product={product} />)

    const addButton = screen.getByRole('button', { name: 'Add to cart' })
    expect(addButton).toBeDisabled()
    expect(screen.getByText('From 1099 EUR')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '512 GB' }))
    expect(screen.getByText('1199 EUR')).toBeInTheDocument()
    expect(addButton).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Black titanium' }))
    expect(addButton).toBeEnabled()
    expect(
      screen.getByRole('img', {
        name: 'Samsung Galaxy S24 Ultra in Black titanium',
      }),
    ).toHaveAttribute('src', 'https://example.com/black.png')

    await user.click(addButton)
    expect(useCartStore.getState().lines).toEqual([
      expect.objectContaining({
        color: 'Black titanium',
        storage: '512 GB',
        unitPrice: 1199,
      }),
    ])
    expect(screen.getByRole('radio', { name: '512 GB' })).not.toBeChecked()
    expect(
      screen.getByRole('radio', { name: 'Black titanium' }),
    ).not.toBeChecked()
    expect(addButton).toBeDisabled()
    expect(push).toHaveBeenCalledWith('/cart')
  })

  it('supports Enter activation and exposes unavailable configuration recovery', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<ProductConfigurator product={product} />)
    const color = screen.getByRole('radio', { name: 'Blue titanium' })
    color.focus()
    await user.keyboard('{Enter}')
    expect(color).toBeChecked()

    rerender(
      <ProductConfigurator product={{ ...product, storageOptions: [] }} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Configuration unavailable',
    )
    expect(
      screen.getByRole('link', { name: 'Browse Products' }),
    ).toHaveAttribute('href', '/')
  })

  it('restarts the color-name entrance when the visible color changes', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProductConfigurator product={product} />)

    await user.click(screen.getByRole('radio', { name: 'Blue titanium' }))
    const blueName = container.querySelector('.color-option-name')
    expect(blueName).toHaveTextContent('Blue titanium')

    await user.click(screen.getByRole('radio', { name: 'Black titanium' }))
    const blackName = container.querySelector('.color-option-name')
    expect(blackName).toHaveTextContent('Black titanium')
    expect(blackName).not.toBe(blueName)
  })
})
