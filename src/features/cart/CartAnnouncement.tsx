'use client'

import { useCartStore } from './cartStore'

export const CartAnnouncement = () => {
  const announcement = useCartStore((state) => state.announcement)

  return (
    <p aria-atomic="true" aria-live="polite" className="sr-only" role="status">
      {announcement}
    </p>
  )
}
