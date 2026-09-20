'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { ProductImage } from '@/components/shared/ProductImage'
import { ProductNavigationLink } from '@/components/shared/ProductNavigationLink'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/features/cart/cartStore'

import {
  createProductVariant,
  type ProductConfiguratorData,
} from './productVariant'

type ProductConfiguratorProps = {
  product: ProductConfiguratorData
}

const productImageSizes = [
  '(min-width: 1280px) 510px',
  '(min-width: 768px) 337px',
  '260px',
].join(', ')

export const ProductConfigurator = ({ product }: ProductConfiguratorProps) => {
  const router = useRouter()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const colorGroupId = useId()
  const storageGroupId = useId()
  const addLine = useCartStore((state) => state.addLine)
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null,
  )
  const [hoveredColorIndex, setHoveredColorIndex] = useState<number | null>(
    null,
  )
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<
    number | null
  >(null)
  const selectedColor =
    selectedColorIndex === null
      ? null
      : (product.colorOptions[selectedColorIndex] ?? null)
  const selectedStorage =
    selectedStorageIndex === null
      ? null
      : (product.storageOptions[selectedStorageIndex] ?? null)
  const displayedColor = selectedColor ?? product.colorOptions[0]
  const visibleColor =
    hoveredColorIndex === null
      ? selectedColor
      : (product.colorOptions[hoveredColorIndex] ?? null)
  const selectedVariant = createProductVariant(
    product,
    selectedColor,
    selectedStorage,
  )
  const hasStorageConfigurations = product.storageOptions.length > 0
  const imageName = selectedColor
    ? `${product.brand} ${product.name} in ${selectedColor.name}`
    : `${product.brand} ${product.name}`

  useEffect(() => {
    if (window.location.hash !== '#product-heading') {
      return
    }

    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [])

  return (
    <div className="product-hero">
      <div className="product-main-image">
        <ProductImage
          alt={imageName}
          key={displayedColor.imageUrl}
          sizes={productImageSizes}
          src={displayedColor.imageUrl}
        />
      </div>
      <div className="product-configurator">
        <div className="product-heading-group">
          <h1
            className="product-title"
            id="product-heading"
            ref={headingRef}
            tabIndex={-1}
          >
            {product.name}
          </h1>
          <p className="product-price">
            {selectedStorage
              ? `${selectedStorage.price} EUR`
              : `From ${product.basePrice} EUR`}
          </p>
        </div>
        {hasStorageConfigurations ? (
          <>
            <div className="product-options">
              <fieldset className="product-option-group">
                <legend className="product-option-legend">
                  Storage
                  <span aria-hidden="true">. How much space do you need?</span>
                </legend>
                <div className="storage-options">
                  {product.storageOptions.map((storage, index) => {
                    const optionId = `${storageGroupId}-${index}`

                    return (
                      <div className="storage-option" key={optionId}>
                        <input
                          checked={selectedStorageIndex === index}
                          className="peer sr-only"
                          id={optionId}
                          name={`${storageGroupId}-storage`}
                          onChange={() => setSelectedStorageIndex(index)}
                          type="radio"
                        />
                        <label htmlFor={optionId}>{storage.capacity}</label>
                      </div>
                    )
                  })}
                </div>
              </fieldset>
              <fieldset className="product-option-group">
                <legend className="product-option-legend">
                  Color<span aria-hidden="true">. Pick your favourite.</span>
                </legend>
                <div className="color-options">
                  {product.colorOptions.map((color, index) => {
                    const optionId = `${colorGroupId}-${index}`

                    return (
                      <div
                        className="color-option"
                        key={optionId}
                        onMouseEnter={() => setHoveredColorIndex(index)}
                        onMouseLeave={() => setHoveredColorIndex(null)}
                      >
                        <input
                          checked={selectedColorIndex === index}
                          className="peer sr-only"
                          id={optionId}
                          name={`${colorGroupId}-color`}
                          onChange={() => setSelectedColorIndex(index)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              setSelectedColorIndex(index)
                            }
                          }}
                          type="radio"
                        />
                        <label htmlFor={optionId}>
                          <span
                            className="color-swatch-frame"
                            aria-hidden="true"
                          >
                            <span
                              className="color-swatch"
                              style={{ backgroundColor: color.hexCode }}
                            />
                          </span>
                          <span className="sr-only">{color.name}</span>
                        </label>
                      </div>
                    )
                  })}
                  {visibleColor ? (
                    <p
                      aria-hidden="true"
                      className="color-option-name"
                      key={`${visibleColor.name}-${visibleColor.hexCode}`}
                    >
                      {visibleColor.name}
                    </p>
                  ) : null}
                </div>
              </fieldset>
            </div>
            <Button
              className="product-add-button"
              disabled={!selectedVariant}
              onClick={() => {
                if (!selectedVariant) {
                  return
                }

                addLine(selectedVariant)
                setSelectedColorIndex(null)
                setHoveredColorIndex(null)
                setSelectedStorageIndex(null)
                router.push('/cart')
              }}
              size="large"
              type="button"
            >
              Add to cart
            </Button>
            <p aria-live="polite" className="sr-only" role="status">
              {selectedColor
                ? `Selected color: ${selectedColor.name}.`
                : 'No color selected.'}{' '}
              {selectedStorage
                ? `Selected storage: ${selectedStorage.capacity}. Final price: ${selectedStorage.price} EUR.`
                : 'No storage selected.'}{' '}
              {selectedVariant ? 'Product variant complete.' : ''}
            </p>
          </>
        ) : (
          <div
            aria-labelledby="configuration-unavailable-heading"
            className="configuration-unavailable"
            role="status"
          >
            <div className="configuration-unavailable-copy">
              <h2 id="configuration-unavailable-heading">
                Configuration unavailable
              </h2>
              <p>This Product has no storage configurations available.</p>
            </div>
            <Button
              asChild
              className="product-add-button"
              size="large"
              variant="outline"
            >
              <ProductNavigationLink href="/">
                Browse Products
              </ProductNavigationLink>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
