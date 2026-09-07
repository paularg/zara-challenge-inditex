'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

type ProductNavigationLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  returnToPreviousPage?: boolean
}

const productNavigationStorageKey = 'mbst-product-navigation'

type ProductNavigation = {
  destinationPathname: string
}

const getProductNavigation = (): ProductNavigation | null => {
  try {
    const value = window.sessionStorage.getItem(productNavigationStorageKey)

    if (!value) {
      return null
    }

    const navigation: unknown = JSON.parse(value)

    return typeof navigation === 'object' &&
      navigation !== null &&
      'destinationPathname' in navigation &&
      typeof navigation.destinationPathname === 'string'
      ? { destinationPathname: navigation.destinationPathname }
      : null
  } catch {
    return null
  }
}

const rememberProductNavigation = (href: string) => {
  const destination = new URL(href, window.location.origin)

  if (!destination.pathname.startsWith('/products/')) {
    return
  }

  try {
    window.sessionStorage.setItem(
      productNavigationStorageKey,
      JSON.stringify({ destinationPathname: destination.pathname }),
    )
  } catch {
    // Navigation falls back to the target URL when browser storage is unavailable.
  }
}

const forgetProductNavigation = () => {
  try {
    window.sessionStorage.removeItem(productNavigationStorageKey)
  } catch {
    // The browser history still provides the navigation fallback.
  }
}

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const waitForNavigationCommit = (previousUrl: string) =>
  new Promise<void>((resolve) => {
    let settled = false
    let timeout = 0
    let checkTimer = 0
    const finish = () => {
      if (settled) return

      settled = true
      window.clearTimeout(timeout)
      window.clearTimeout(checkTimer)
      resolve()
    }

    const checkUrl = () => {
      if (settled) return

      if (window.location.href === previousUrl) {
        checkTimer = window.setTimeout(checkUrl, 16)
        return
      }

      finish()
    }

    timeout = window.setTimeout(finish, 3_000)
    checkUrl()
  })

export const ProductNavigationLink = ({
  href,
  onNavigate,
  returnToPreviousPage = false,
  ...props
}: ProductNavigationLinkProps) => {
  const router = useRouter()

  const navigate = () => {
    const navigation = getProductNavigation()
    const shouldReturnToPreviousPage =
      returnToPreviousPage &&
      navigation?.destinationPathname === window.location.pathname

    if (shouldReturnToPreviousPage) {
      forgetProductNavigation()
      router.back()
      return
    }

    if (!returnToPreviousPage) {
      rememberProductNavigation(href)
    }

    router.push(href, { scroll: true })
  }

  const handleNavigate: NonNullable<
    ComponentProps<typeof Link>['onNavigate']
  > = (event) => {
    onNavigate?.(event)

    if (prefersReducedMotion() || !document.startViewTransition) {
      if (!returnToPreviousPage) {
        rememberProductNavigation(href)
        return
      }

      if (
        getProductNavigation()?.destinationPathname === window.location.pathname
      ) {
        event.preventDefault()
        navigate()
      }

      return
    }

    event.preventDefault()
    const previousUrl = window.location.href
    const transition = document.startViewTransition(async () => {
      navigate()
      await waitForNavigationCommit(previousUrl)
    })

    void transition.finished.catch(() => undefined)
  }

  return <Link {...props} href={href} onNavigate={handleNavigate} />
}
