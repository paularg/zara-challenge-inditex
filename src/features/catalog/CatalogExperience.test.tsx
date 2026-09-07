import { act, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CatalogExperience } from './CatalogExperience'

const navigation = vi.hoisted(() => ({
  pathname: '/',
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.searchParams,
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode
    href: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  navigation.pathname = '/'
  navigation.searchParams = new URLSearchParams()
  navigation.replace.mockReset()
})

describe('CatalogExperience', () => {
  it('debounces a normalized query and replaces the URL without scrolling', async () => {
    const nativeSetTimeout = window.setTimeout.bind(window)
    let runDebounce: (() => void) | undefined
    vi.spyOn(window, 'setTimeout').mockImplementation((handler, delay) => {
      if (delay === 300 && typeof handler === 'function') {
        runDebounce = () => handler()
        return 99 as unknown as NodeJS.Timeout
      }

      return nativeSetTimeout(handler, delay) as unknown as NodeJS.Timeout
    })
    render(
      <CatalogExperience confirmedQuery="">
        <p>Current Products</p>
      </CatalogExperience>,
    )

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search Products' }),
      { target: { value: ' Samsung ' } },
    )
    expect(navigation.replace).not.toHaveBeenCalled()

    await act(async () => runDebounce?.())
    expect(navigation.replace).toHaveBeenCalledWith('/?search=Samsung', {
      scroll: false,
    })
    expect(screen.getByText('Current Products')).toBeInTheDocument()
  })

  it('clears immediately, preserves unrelated parameters, and restores focus', async () => {
    navigation.searchParams = new URLSearchParams(
      'campaign=summer&search=Samsung',
    )
    render(
      <CatalogExperience confirmedQuery="Samsung">
        <p>Results</p>
      </CatalogExperience>,
    )

    const input = screen.getByRole('searchbox', { name: 'Search Products' })
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input).toHaveValue('')
    expect(navigation.replace).toHaveBeenCalledWith('/?campaign=summer', {
      scroll: false,
    })
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 0)))
    expect(input).toHaveFocus()
  })

  it('syncs the draft when browser navigation changes the confirmed query', () => {
    navigation.searchParams = new URLSearchParams('search=Samsung')
    const { rerender } = render(
      <CatalogExperience confirmedQuery="Samsung">
        <p>Results</p>
      </CatalogExperience>,
    )

    navigation.searchParams = new URLSearchParams('search=Apple')
    rerender(
      <CatalogExperience confirmedQuery="Apple">
        <p>Results</p>
      </CatalogExperience>,
    )

    expect(
      screen.getByRole('searchbox', { name: 'Search Products' }),
    ).toHaveValue('Apple')
  })
})
