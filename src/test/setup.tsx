import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const imageProps = { ...props }
    delete imageProps.fill
    delete imageProps.preload
    return createElement('img', imageProps)
  },
}))

class ResizeObserverMock implements ResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn((query: string) => ({
    addEventListener: vi.fn(),
    addListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
    removeListener: vi.fn(),
  })),
})

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0)
window.cancelAnimationFrame = (handle) => window.clearTimeout(handle)
window.scrollTo = vi.fn()

afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.clearAllTimers()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
