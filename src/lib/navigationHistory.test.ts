import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  consumeCurrentNavigationDestination,
  rememberNavigationDestination,
} from './navigationHistory'

describe('navigation history', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('consumes chained destinations one at a time', () => {
    rememberNavigationDestination('/products/galaxy-s24#product-heading')
    window.history.replaceState({}, '', '/products/galaxy-s24')
    rememberNavigationDestination('/products/iphone-15#product-heading')

    window.history.replaceState({}, '', '/products/iphone-15')
    expect(consumeCurrentNavigationDestination()).toBe(true)

    window.history.replaceState({}, '', '/products/galaxy-s24')
    expect(consumeCurrentNavigationDestination()).toBe(true)
    expect(consumeCurrentNavigationDestination()).toBe(false)
  })

  it('reconciles the trail after native browser navigation', () => {
    rememberNavigationDestination('/products/galaxy-s24')
    window.history.replaceState({}, '', '/products/galaxy-s24')
    rememberNavigationDestination('/products/iphone-15')

    window.history.replaceState({}, '', '/products/galaxy-s24')
    rememberNavigationDestination('/products/pixel-9')

    window.history.replaceState({}, '', '/products/pixel-9')
    expect(consumeCurrentNavigationDestination()).toBe(true)
    window.history.replaceState({}, '', '/products/galaxy-s24')
    expect(consumeCurrentNavigationDestination()).toBe(true)
  })

  it('recovers from corrupt storage', () => {
    window.sessionStorage.setItem('mbst-navigation-history', '{broken')

    expect(consumeCurrentNavigationDestination()).toBe(false)
    expect(() =>
      rememberNavigationDestination('/products/galaxy-s24'),
    ).not.toThrow()
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

    expect(() =>
      rememberNavigationDestination('/products/galaxy-s24'),
    ).not.toThrow()
    expect(consumeCurrentNavigationDestination()).toBe(false)
  })
})
