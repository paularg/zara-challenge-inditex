import type {
  ProductColor,
  ProductStorage,
} from '@/features/products/contracts'

export type ProductConfiguratorData = {
  id: string
  brand: string
  name: string
  basePrice: number
  colorOptions: ProductColor[]
  storageOptions: ProductStorage[]
}

export type ProductVariant = {
  productId: string
  brand: string
  name: string
  imageUrl: string
  color: string
  storage: string
  unitPrice: number
}

export const createProductVariant = (
  product: ProductConfiguratorData,
  color: ProductColor | null,
  storage: ProductStorage | null,
): ProductVariant | null =>
  color && storage
    ? {
        productId: product.id,
        brand: product.brand,
        name: product.name,
        imageUrl: color.imageUrl,
        color: color.name,
        storage: storage.capacity,
        unitPrice: storage.price,
      }
    : null
