export const ProductSkeleton = () => (
  <div aria-busy="true" className="product-hero-skeleton">
    <div aria-hidden="true" className="product-image-skeleton" />
    <div aria-hidden="true" className="product-info-skeleton">
      <div className="product-title-skeleton" />
      <div className="product-price-skeleton" />
      <div className="product-options-skeleton" />
    </div>
    <span className="sr-only">Loading Product details</span>
  </div>
)
