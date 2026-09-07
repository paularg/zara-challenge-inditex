import { ProductCard } from '@/components/shared/ProductCard'
import type { ProductDetails } from '@/features/products/contracts'

import { ProductCarousel } from './ProductCarousel'
import { ProductConfigurator } from './ProductConfigurator'

type ProductScaffoldProps = {
  product: ProductDetails
}

const specificationRows = (
  product: ProductDetails,
): Array<readonly [string, string]> => {
  const rows: Array<readonly [string, string | undefined]> = [
    ['Brand', product.brand],
    ['Name', product.name],
    ['Description', product.description],
    ['Screen', product.specs.screen],
    ['Resolution', product.specs.resolution],
    ['Processor', product.specs.processor],
    ['Main camera', product.specs.mainCamera],
    ['Selfie camera', product.specs.selfieCamera],
    ['Battery', product.specs.battery],
    ['OS', product.specs.os],
    ['Screen refresh rate', product.specs.screenRefreshRate],
  ]

  return rows.flatMap(([label, value]) =>
    value === undefined ? [] : [[label, value] as const],
  )
}

export const ProductScaffold = ({ product }: ProductScaffoldProps) => {
  const configuratorProduct = {
    id: product.id,
    brand: product.brand,
    name: product.name,
    basePrice: product.basePrice,
    colorOptions: product.colorOptions,
    storageOptions: product.storageOptions,
  }

  return (
    <article
      aria-labelledby="product-heading"
      className="product-content-shell"
    >
      <ProductConfigurator product={configuratorProduct} />
      <section
        aria-labelledby="specifications-heading"
        className="product-specifications"
      >
        <h2 id="specifications-heading">Specifications</h2>
        <table aria-label="Product specifications">
          <colgroup>
            <col className="specification-label-column" />
            <col />
          </colgroup>
          <tbody>
            {specificationRows(product).map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {product.similarProducts.length > 0 ? (
        <section
          aria-labelledby="similar-products-heading"
          className="similar-products"
        >
          <h2 id="similar-products-heading">Similar Items</h2>
          <ProductCarousel>
            {product.similarProducts.map((similarProduct) => (
              <ProductCard
                className="similar-product-card"
                focusProductStart
                key={similarProduct.id}
                product={similarProduct}
              />
            ))}
          </ProductCarousel>
        </section>
      ) : null}
    </article>
  )
}
