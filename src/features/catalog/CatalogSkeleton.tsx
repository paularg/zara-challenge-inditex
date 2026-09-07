const skeletonCards = Array.from({ length: 20 }, (_, index) => index)

export const CatalogSkeleton = () => (
  <>
    <p
      aria-atomic="true"
      aria-label="Catalog status"
      className="catalog-status"
      role="status"
    >
      Loading Products
    </p>
    <ul aria-busy="true" aria-label="Products" className="catalog-grid">
      {skeletonCards.map((card) => (
        <li aria-hidden="true" className="catalog-card-skeleton" key={card} />
      ))}
    </ul>
  </>
)
