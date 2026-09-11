import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  canUseNavigationViewTransition,
  startNavigationViewTransition,
  waitForNavigationCommit,
} from './viewTransition'

const viewTransition = (finished = Promise.resolve()) =>
  ({
    finished,
    ready: Promise.resolve(),
    skipTransition: vi.fn(),
    types: new Set<string>(),
    updateCallbackDone: Promise.resolve(),
  }) as unknown as ViewTransition

describe('navigation View Transitions', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it('uses View Transitions only when motion is allowed and supported', () => {
    expect(canUseNavigationViewTransition()).toBe(true)

    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: true,
    } as MediaQueryList)
    expect(canUseNavigationViewTransition()).toBe(false)

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: undefined,
    })
    expect(canUseNavigationViewTransition()).toBe(false)
  })

  it('resolves when navigation commits', async () => {
    vi.useFakeTimers()
    const previousUrl = window.location.href
    const committed = waitForNavigationCommit(previousUrl)

    window.history.pushState({}, '', '/products/galaxy-s24')
    await vi.advanceTimersByTimeAsync(16)

    await expect(committed).resolves.toBeUndefined()
  })

  it('resolves after the navigation timeout', async () => {
    vi.useFakeTimers()
    const committed = waitForNavigationCommit(window.location.href)

    await vi.advanceTimersByTimeAsync(3_000)

    await expect(committed).resolves.toBeUndefined()
  })

  it('starts navigation and absorbs a finished-transition rejection', async () => {
    const finished = Promise.reject(new Error('Transition interrupted'))
    const startViewTransition = vi
      .mocked(document.startViewTransition)
      .mockImplementation((update) => {
        if (typeof update === 'function') {
          void update()
        } else if (update) {
          void update.update?.()
        }
        return viewTransition(finished)
      })
    const navigate = vi.fn(() =>
      window.history.pushState({}, '', '/products/galaxy-s24'),
    )

    startNavigationViewTransition(navigate)
    await expect(finished).rejects.toThrow('Transition interrupted')
    await Promise.resolve()

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledOnce()
  })
})
