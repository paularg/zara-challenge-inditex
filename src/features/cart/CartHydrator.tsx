'use client'

import { useEffect } from 'react'

import { hydrateCart } from './cartStore'

export const CartHydrator = () => {
  useEffect(() => {
    void hydrateCart()
  }, [])

  return null
}
