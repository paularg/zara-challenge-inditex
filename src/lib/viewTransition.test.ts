import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  canUseNavigationViewTransition,
  startNavigationViewTransition,
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

  it('finishes the public transition update after the navigation timeout', async () => {
    vi.useFakeTimers()
    let updateFinished = Promise.resolve()
    vi.mocked(document.startViewTransition).mockImplementation((update) => {
      updateFinished = Promise.resolve(
        typeof update === 'function' ? update() : update?.update?.(),
      )
      return viewTransition()
    })

    const navigate = vi.fn()
    startNavigationViewTransition(navigate)

    await vi.advanceTimersByTimeAsync(3_000)
    await updateFinished

    expect(navigate).toHaveBeenCalledOnce()
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
