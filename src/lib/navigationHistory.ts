import { isRecord } from '@/lib/validation'

const navigationHistoryStorageKey = 'mbst-navigation-history'

type NavigationHistory = {
  destinationPathnames: string[]
}

const parseNavigationHistory = (value: string): NavigationHistory | null => {
  const history: unknown = JSON.parse(value)

  return isRecord(history) &&
    Array.isArray(history.destinationPathnames) &&
    history.destinationPathnames.every(
      (pathname) => typeof pathname === 'string',
    )
    ? { destinationPathnames: history.destinationPathnames }
    : null
}

const readNavigationHistory = (): NavigationHistory | null => {
  try {
    const value = window.sessionStorage.getItem(navigationHistoryStorageKey)

    return value ? parseNavigationHistory(value) : null
  } catch {
    return null
  }
}

const writeNavigationHistory = (history: NavigationHistory): void => {
  try {
    if (history.destinationPathnames.length === 0) {
      window.sessionStorage.removeItem(navigationHistoryStorageKey)
      return
    }

    window.sessionStorage.setItem(
      navigationHistoryStorageKey,
      JSON.stringify(history),
    )
  } catch {
    // Browser navigation remains available when session storage is unavailable.
  }
}

export const rememberNavigationDestination = (href: string): void => {
  const destination = new URL(href, window.location.origin)
  const currentPathname = window.location.pathname

  if (destination.pathname === currentPathname) {
    return
  }

  const rememberedPathnames =
    readNavigationHistory()?.destinationPathnames ?? []
  const currentIndex = rememberedPathnames.lastIndexOf(currentPathname)
  const reconciledPathnames =
    currentIndex === -1 ? [] : rememberedPathnames.slice(0, currentIndex + 1)

  writeNavigationHistory({
    destinationPathnames: [...reconciledPathnames, destination.pathname],
  })
}

export const consumeCurrentNavigationDestination = (): boolean => {
  const history = readNavigationHistory()

  if (history?.destinationPathnames.at(-1) !== window.location.pathname) {
    writeNavigationHistory({ destinationPathnames: [] })
    return false
  }

  writeNavigationHistory({
    destinationPathnames: history.destinationPathnames.slice(0, -1),
  })
  return true
}
