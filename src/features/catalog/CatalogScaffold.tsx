import { ProductCard } from '@/components/shared/ProductCard'
import { CatalogClearSearchButton } from '@/features/catalog/CatalogExperience'
import { getCatalog } from '@/features/products/server'

type CatalogScaffoldProps = {
  query: string
}

export const CatalogScaffold = async ({ query }: CatalogScaffoldProps) => {
  const products = await getCatalog(query)
  const resultLabel = `${products.length} ${
    products.length === 1 ? 'Result' : 'Results'
  }`

  return (
    <>
      <p
        aria-atomic="true"
        aria-label="Catalog status"
        className="catalog-status"
        role="status"
      >
        {resultLabel}
      </p>
      {products.length ? (
        <ul aria-label="Products" className="catalog-grid">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              preloadImage={index === 0}
              product={product}
            />
          ))}
        </ul>
      ) : (
        <div className="catalog-empty-state">
          <p className="catalog-empty-message">
            {query ? `No Products found for “${query}”.` : 'No Products found.'}
          </p>
          {query ? <CatalogClearSearchButton /> : null}
        </div>
      )}
    </>
  )
}
