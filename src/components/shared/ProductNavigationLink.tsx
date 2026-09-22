'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

import {
  consumeCurrentNavigationDestination,
  rememberNavigationDestination,
} from '@/lib/navigationHistory'

type ProductNavigationLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  rememberDestination?: boolean
  returnToPreviousPage?: boolean
}

const navigateBackWithTransition = (navigate: () => void) => {
  if (
    !document.startViewTransition ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    navigate()
    return
  }

  const main = document.getElementById('main-content')
  const previousContent = main?.textContent
  const previousUrl = window.location.href
  document.documentElement.classList.add('product-history-transition')

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        let settled = false
        const finish = () => {
          if (settled) return

          settled = true
          observer.disconnect()
          window.removeEventListener('popstate', check)
          window.clearTimeout(timeout)
          resolve()
        }
        const check = () => {
          if (
            window.location.href !== previousUrl &&
            main?.textContent !== previousContent
          ) {
            finish()
          }
        }
        const observer = new MutationObserver(check)
        observer.observe(main ?? document.body, {
          childList: true,
          characterData: true,
          subtree: true,
        })
        const timeout = window.setTimeout(finish, 3_000)

        window.addEventListener('popstate', check)
        navigate()
      }),
  )

  void transition.finished
    .finally(() =>
      document.documentElement.classList.remove('product-history-transition'),
    )
    .catch(() => undefined)
}

export const ProductNavigationLink = ({
  href,
  onNavigate,
  rememberDestination = false,
  returnToPreviousPage = false,
  ...props
}: ProductNavigationLinkProps) => {
  const router = useRouter()

  const handleNavigate: NonNullable<
    ComponentProps<typeof Link>['onNavigate']
  > = (event) => {
    onNavigate?.(event)

    if (rememberDestination) {
      rememberNavigationDestination(href)
      return
    }

    if (returnToPreviousPage && consumeCurrentNavigationDestination()) {
      event.preventDefault()
      navigateBackWithTransition(() => router.back())
    }
  }

  return <Link {...props} href={href} onNavigate={handleNavigate} />
}
