'use client'

import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware'

import {
  addCartLine,
  decrementCartLine,
  normalizePersistedCartStorageValue,
  restoreCartLines,
  selectCartTotal,
  selectCartUnitCount,
  type CartLine,
  type CartLineId,
  type CartLineInput,
} from './cartRules'

export { selectCartTotal, selectCartUnitCount }
export type { CartLine, CartLineInput }

export const CART_STORAGE_KEY = 'mbst-cart'
export const CART_STORAGE_VERSION = 1
const ANNOUNCEMENT_DURATION_MS = 10_000

type CartState = {
  lines: CartLine[]
  hasHydrated: boolean
  announcement: string
  addLine: (line: CartLineInput) => void
  decrementLine: (lineId: CartLineId) => void
  announce: (message: string) => void
}

type PersistedCartState = Pick<CartState, 'lines'>

const cartStateStorage: StateStorage = {
  getItem: (name) => {
    try {
      const storedValue = window.localStorage.getItem(name)
      const normalizedValue = normalizePersistedCartStorageValue(
        storedValue,
        CART_STORAGE_VERSION,
      )

      if (normalizedValue !== storedValue && normalizedValue !== null) {
        try {
          window.localStorage.setItem(name, normalizedValue)
        } catch {
          // The in-memory Cart remains usable when storage cannot be repaired.
        }
      }

      return normalizedValue
    } catch {
      return null
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Persistence is best-effort; Cart interactions must remain available.
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Persistence is best-effort; Cart interactions must remain available.
    }
  },
}

const storage = createJSONStorage<PersistedCartState>(() => cartStateStorage)
let announcementTimeout: number | undefined

const restartAnnouncementTimer = (clearAnnouncement: () => void) => {
  if (typeof window === 'undefined') {
    return
  }

  if (announcementTimeout !== undefined) {
    window.clearTimeout(announcementTimeout)
  }

  announcementTimeout = window.setTimeout(() => {
    announcementTimeout = undefined
    clearAnnouncement()
  }, ANNOUNCEMENT_DURATION_MS)
}

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], PersistedCartState>(
    (set) => {
      const scheduleAnnouncementClear = () => {
        restartAnnouncementTimer(() => set({ announcement: '' }))
      }

      return {
        lines: [],
        hasHydrated: false,
        announcement: '',
        addLine: (line) => {
          set((state) => ({
            lines: addCartLine(state.lines, line),
            announcement: `${line.name}, ${line.color}, ${line.storage} added to Cart.`,
          }))
          scheduleAnnouncementClear()
        },
        decrementLine: (lineId) =>
          set((state) => ({ lines: decrementCartLine(state.lines, lineId) })),
        announce: (message) => {
          set({ announcement: message })
          scheduleAnnouncementClear()
        },
      }
    },
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
      storage,
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        lines: restoreCartLines(persistedState),
      }),
    },
  ),
)

let hydrationPromise: Promise<void> | null = null

export const hydrateCart = (): Promise<void> => {
  if (useCartStore.getState().hasHydrated) {
    return Promise.resolve()
  }

  hydrationPromise ??= Promise.resolve(useCartStore.persist.rehydrate())
    .catch(() => undefined)
    .finally(() => {
      useCartStore.setState({ hasHydrated: true })
      hydrationPromise = null
    })

  return hydrationPromise
}
