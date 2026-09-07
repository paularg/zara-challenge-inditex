'use client'

import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

export type ProductImageProps = {
  alt: string
  className?: string
  priority?: boolean
  sizes: string
  src: string
}

export const ProductImage = ({
  alt,
  className,
  priority = false,
  sizes,
  src,
}: ProductImageProps) => {
  const [imageFailed, setImageFailed] = useState(false)

  if (imageFailed) {
    return (
      <div
        aria-label={`${alt} image unavailable`}
        className={cn(
          'text-muted-foreground flex size-full items-center justify-center text-center text-xs font-light uppercase',
          className,
        )}
        role="img"
      >
        Image unavailable
      </div>
    )
  }

  return (
    <Image
      alt={alt}
      className={cn('object-contain', className)}
      fill
      onError={() => setImageFailed(true)}
      preload={priority}
      sizes={sizes}
      src={src}
    />
  )
}
