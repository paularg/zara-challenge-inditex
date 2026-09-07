import { ProductImage } from '@/components/shared/ProductImage'
import { ProductNavigationLink } from '@/components/shared/ProductNavigationLink'
import { cn } from '@/lib/utils'

export type ProductCardData = {
  basePrice: number
  brand: string
  id: string
  imageUrl: string
  name: string
}

type ProductCardProps = {
  className?: string
  focusProductStart?: boolean
  preloadImage?: boolean
  product: ProductCardData
}

const productImageSizes = [
  '(min-width: 1920px) 312px',
  '(min-width: 1576px) calc((100vw - 200px) / 4 - 32px)',
  '(min-width: 1280px) calc((100vw - 200px) / 3 - 32px)',
  '(min-width: 1112px) calc((100vw - 80px) / 3 - 32px)',
  '(min-width: 768px) calc((100vw - 80px) / 2 - 32px)',
  'calc(100vw - 64px)',
].join(', ')

export const ProductCard = ({
  className,
  focusProductStart = false,
  preloadImage = false,
  product,
}: ProductCardProps) => {
  const imageName = `${product.brand} ${product.name}`
  const productPath = `/products/${encodeURIComponent(product.id)}`

  return (
    <li className={cn('catalog-card', className)}>
      <ProductNavigationLink
        aria-label={`Open ${imageName}`}
        className="catalog-card-link focus-outline"
        href={
          focusProductStart ? `${productPath}#product-heading` : productPath
        }
      >
        <span aria-hidden="true" className="catalog-card-wipe" />
        <div className="catalog-card-image">
          <ProductImage
            alt={imageName}
            priority={preloadImage}
            sizes={productImageSizes}
            src={product.imageUrl}
          />
        </div>
        <div className="catalog-card-info">
          <div className="catalog-card-name">
            <p className="catalog-card-brand">{product.brand}</p>
            <p className="catalog-card-product">{product.name}</p>
          </div>
          <p className="catalog-card-price">{product.basePrice} EUR</p>
        </div>
      </ProductNavigationLink>
    </li>
  )
}
