import Image from 'next/image'
import Link from 'next/link'

import { CartIndicator } from '@/components/shared/CartIndicator'

export const Header = () => (
  <header className="bg-background page-edge flex h-20 shrink-0 items-center justify-between py-6">
    <Link
      aria-label="MBST home"
      className="focus-outline inline-flex h-8 items-center"
      href="/"
    >
      <Image
        aria-hidden="true"
        alt=""
        height={24}
        preload
        src="/assets/mbst-wordmark.svg"
        width={74}
      />
    </Link>
    <CartIndicator />
  </header>
)
