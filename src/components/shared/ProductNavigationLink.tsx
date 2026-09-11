'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

import {
  forgetProductNavigation,
  rememberProductNavigation,
  shouldReturnToRememberedProduct,
} from '@/components/shared/productNavigationHistory'
import {
  canUseNavigationViewTransition,
  startNavigationViewTransition,
} from '@/lib/viewTransition'

type ProductNavigationLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  returnToPreviousPage?: boolean
}

export const ProductNavigationLink = ({
  href,
  onNavigate,
  returnToPreviousPage = false,
  ...props
}: ProductNavigationLinkProps) => {
  const router = useRouter()

  const navigate = () => {
    const shouldReturn =
      returnToPreviousPage && shouldReturnToRememberedProduct()

    if (shouldReturn) {
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

    if (!canUseNavigationViewTransition()) {
      if (!returnToPreviousPage) {
        rememberProductNavigation(href)
        return
      }

      if (shouldReturnToRememberedProduct()) {
        event.preventDefault()
        navigate()
      }

      return
    }

    event.preventDefault()
    startNavigationViewTransition(navigate)
  }

  return <Link {...props} href={href} onNavigate={handleNavigate} />
}
