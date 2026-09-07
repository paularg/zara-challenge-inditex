export type ProductSummary = {
  id: string
  brand: string
  name: string
  basePrice: number
  imageUrl: string
}

export type ProductSpecs = {
  screen?: string
  resolution?: string
  processor?: string
  mainCamera?: string
  selfieCamera?: string
  battery?: string
  os?: string
  screenRefreshRate?: string
}

export type ProductColor = {
  name: string
  hexCode: string
  imageUrl: string
}

export type ProductStorage = {
  capacity: string
  price: number
}

export type ProductDetails = {
  id: string
  brand: string
  name: string
  description: string
  basePrice: number
  specs: ProductSpecs
  colorOptions: ProductColor[]
  storageOptions: ProductStorage[]
  similarProducts: ProductSummary[]
}

export type ProductDataErrorKind =
  'authentication' | 'configuration' | 'invalid-payload' | 'network' | 'server'

export class ProductDataError extends Error {
  readonly kind: ProductDataErrorKind

  constructor(kind: ProductDataErrorKind, message: string) {
    super(message)
    this.name = 'ProductDataError'
    this.kind = kind
  }
}
