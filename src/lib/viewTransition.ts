const navigationCommitTimeout = 3_000
const navigationCommitPollInterval = 16

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export const canUseNavigationViewTransition = (): boolean =>
  !prefersReducedMotion() && Boolean(document.startViewTransition)

const waitForNavigationCommit = (previousUrl: string): Promise<void> =>
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
        checkTimer = window.setTimeout(checkUrl, navigationCommitPollInterval)
        return
      }

      finish()
    }

    timeout = window.setTimeout(finish, navigationCommitTimeout)
    checkUrl()
  })

export const startNavigationViewTransition = (navigate: () => void): void => {
  const previousUrl = window.location.href
  const transition = document.startViewTransition(async () => {
    navigate()
    await waitForNavigationCommit(previousUrl)
  })

  void transition.finished.catch(() => undefined)
}
