'use client'

import { catchError, type ErrorInfo } from 'next/error'

import { Button } from '@/components/ui/button'

type RecoverableErrorBoundaryProps = {
  message: string
  title: string
}

const RecoverableErrorFallback = (
  { message, title }: RecoverableErrorBoundaryProps,
  { retry }: ErrorInfo,
) => (
  <div className="route-state">
    <div className="route-state-copy" role="alert">
      <h2 className="route-state-title">{title}</h2>
      <p className="route-state-message">{message}</p>
    </div>
    <Button onClick={() => retry()} type="button">
      Retry
    </Button>
  </div>
)

export const RecoverableErrorBoundary = catchError(RecoverableErrorFallback)
