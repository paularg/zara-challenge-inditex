'use client'

import type { KeyboardEvent, ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'

type ProductCarouselProps = {
  children: ReactNode
}

export const ProductCarousel = ({ children }: ProductCarouselProps) => {
  const carouselRef = useRef<HTMLUListElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  const updateThumb = useCallback(() => {
    const carousel = carouselRef.current
    const track = trackRef.current
    const thumb = thumbRef.current

    if (!carousel || !track || !thumb) {
      return
    }

    const scrollableWidth = carousel.scrollWidth - carousel.clientWidth
    const progress =
      scrollableWidth > 0
        ? Math.min(Math.max(carousel.scrollLeft / scrollableWidth, 0), 1)
        : 0
    const offset = progress * (track.clientWidth - thumb.offsetWidth)

    thumb.style.transform = `translateX(${Math.max(offset, 0)}px)`
  }, [])

  useEffect(() => {
    const carousel = carouselRef.current
    const track = trackRef.current

    if (!carousel || !track) {
      return
    }

    let animationFrame: number | undefined
    const scheduleUpdate = () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = undefined
        updateThumb()
      })
    }
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(scheduleUpdate)

    resizeObserver?.observe(carousel)
    resizeObserver?.observe(track)
    Array.from(carousel.children).forEach((child) => {
      resizeObserver?.observe(child)
    })
    updateThumb()
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      resizeObserver?.disconnect()
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame)
      }
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [children, updateThumb])

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    carouselRef.current?.scrollBy({
      behavior: 'auto',
      left: event.key === 'ArrowRight' ? 344 : -344,
    })
  }

  return (
    <>
      <ul
        aria-label="Similar Items carousel"
        className="similar-products-carousel focus-outline"
        onKeyDown={handleKeyDown}
        onScroll={updateThumb}
        ref={carouselRef}
        tabIndex={0}
      >
        {children}
      </ul>
      <div className="carousel-track" ref={trackRef} role="presentation">
        <div className="carousel-thumb" ref={thumbRef} />
      </div>
    </>
  )
}
