import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section aria-labelledby="not-found-heading" className="route-state">
      <div className="route-state-copy">
        <h1 className="route-state-title" id="not-found-heading">
          Page not found
        </h1>
        <p className="route-state-message">
          The requested page does not exist.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/">Return to catalog</Link>
      </Button>
    </section>
  )
}
