import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  forgetProductNavigation,
  getProductNavigation,
  rememberProductNavigation,
  shouldReturnToRememberedProduct,
} from './productNavigationHistory'

describe('Product navigation history', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('remembers and forgets Product destinations', () => {
    rememberProductNavigation('/products/galaxy-s24#product-heading')

    expect(getProductNavigation()).toEqual({
      destinationPathname: '/products/galaxy-s24',
    })

    window.history.replaceState({}, '', '/products/galaxy-s24')
    expect(shouldReturnToRememberedProduct()).toBe(true)

    forgetProductNavigation()
    expect(getProductNavigation()).toBeNull()
  })

  it('ignores destinations outside Product details', () => {
    rememberProductNavigation('/cart')

    expect(getProductNavigation()).toBeNull()
  })

  it('recovers from corrupt storage', () => {
    window.sessionStorage.setItem('mbst-product-navigation', '{broken')

    expect(getProductNavigation()).toBeNull()
  })

  it('falls back when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    expect(getProductNavigation()).toBeNull()
    expect(() =>
      rememberProductNavigation('/products/galaxy-s24'),
    ).not.toThrow()
    expect(forgetProductNavigation).not.toThrow()
  })
})
