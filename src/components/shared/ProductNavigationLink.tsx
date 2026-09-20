'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

import {
  consumeCurrentNavigationDestination,
  rememberNavigationDestination,
} from '@/lib/navigationHistory'
import {
  canUseNavigationViewTransition,
  startNavigationViewTransition,
} from '@/lib/viewTransition'

type ProductNavigationLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  rememberDestination?: boolean
  returnToPreviousPage?: boolean
}

export const ProductNavigationLink = ({
  href,
  onNavigate,
  rememberDestination = false,
  returnToPreviousPage = false,
  ...props
}: ProductNavigationLinkProps) => {
  const router = useRouter()

  const navigate = () => {
    if (returnToPreviousPage && consumeCurrentNavigationDestination()) {
      router.back()
      return
    }

    if (rememberDestination) {
      rememberNavigationDestination(href)
    }

    router.push(href, { scroll: true })
  }

  const handleNavigate: NonNullable<
    ComponentProps<typeof Link>['onNavigate']
  > = (event) => {
    onNavigate?.(event)

    if (!canUseNavigationViewTransition()) {
      if (rememberDestination) {
        rememberNavigationDestination(href)
        return
      }

      if (returnToPreviousPage && consumeCurrentNavigationDestination()) {
        event.preventDefault()
        router.back()
      }

      return
    }

    event.preventDefault()
    startNavigationViewTransition(navigate)
  }

  return <Link {...props} href={href} onNavigate={handleNavigate} />
}
