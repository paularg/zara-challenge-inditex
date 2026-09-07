import type { Metadata } from 'next'

import { Header } from '@/components/shared/Header'
import { CartHydrator } from '@/features/cart/CartHydrator'

import './globals.css'

export const metadata: Metadata = {
  title: 'MBST Smartphone Store',
  description: 'Browse and compare smartphones in the MBST catalog.',
  icons: {
    icon: '/assets/mbst-wordmark.svg',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-background text-foreground flex min-h-svh flex-col">
        <CartHydrator />
        <a
          className="focus-outline bg-primary text-primary-foreground sr-only z-50 px-4 py-3 focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
          href="#main-content"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  )
}
