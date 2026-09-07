'use client'

import Image from 'next/image'
import Link from 'next/link'

import { selectCartUnitCount, useCartStore } from '@/features/cart/cartStore'

export const CartIndicator = () => {
  const count = useCartStore(selectCartUnitCount)
  const hasHydrated = useCartStore((state) => state.hasHydrated)

  return (
    <Link
      aria-label={
        hasHydrated
          ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}`
          : 'Cart, loading'
      }
      className="focus-outline inline-flex min-h-11 min-w-11 items-center justify-end gap-1.5 text-base leading-4 font-light uppercase"
      href="/cart"
    >
      <Image
        aria-hidden="true"
        alt=""
        height={18}
        src="/assets/bag.svg"
        width={18}
      />
      <span aria-hidden="true" className="inline-block min-w-[1ch]">
        {hasHydrated ? count : null}
      </span>
    </Link>
  )
}
