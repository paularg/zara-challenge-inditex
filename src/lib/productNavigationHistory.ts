import { isRecord } from '@/lib/validation'

const productNavigationStorageKey = 'mbst-product-navigation'

type ProductNavigation = {
  destinationPathname: string
}

const parseProductNavigation = (value: string): ProductNavigation | null => {
  const navigation: unknown = JSON.parse(value)

  return isRecord(navigation) &&
    typeof navigation.destinationPathname === 'string'
    ? { destinationPathname: navigation.destinationPathname }
    : null
}

export const getProductNavigation = (): ProductNavigation | null => {
  try {
    const value = window.sessionStorage.getItem(productNavigationStorageKey)

    return value ? parseProductNavigation(value) : null
  } catch {
    return null
  }
}

export const rememberProductNavigation = (href: string): void => {
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

export const forgetProductNavigation = (): void => {
  try {
    window.sessionStorage.removeItem(productNavigationStorageKey)
  } catch {
    // The browser history still provides the navigation fallback.
  }
}

export const shouldReturnToRememberedProduct = (): boolean =>
  getProductNavigation()?.destinationPathname === window.location.pathname
