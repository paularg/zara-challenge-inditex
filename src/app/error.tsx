'use client'

import { Button } from '@/components/ui/button'

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <section aria-labelledby="route-error-heading" className="route-state">
      <div className="route-state-copy" role="alert">
        <h1 className="route-state-title" id="route-error-heading">
          Page unavailable
        </h1>
        <p className="route-state-message">
          This page could not be displayed. Please try again.
        </p>
      </div>
      <Button onClick={() => retry()} type="button">
        Retry
      </Button>
    </section>
  )
}
