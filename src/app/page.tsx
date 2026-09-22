import { redirect } from 'next/navigation'
import { Suspense, ViewTransition } from 'react'

import { RecoverableErrorBoundary } from '@/components/shared/RecoverableErrorBoundary'
import { CatalogExperience } from '@/features/catalog/CatalogExperience'
import { CatalogScaffold } from '@/features/catalog/CatalogScaffold'
import { CatalogSkeleton } from '@/features/catalog/CatalogSkeleton'
import {
  createCatalogUrl,
  normalizeSearchQuery,
} from '@/features/catalog/catalogSearch'

const CatalogPageSkeleton = () => (
  <div className="catalog-experience">
    <div className="catalog-search-shell">
      <div aria-hidden="true" className="catalog-search-placeholder">
        Search for a smartphone...
      </div>
    </div>
    <div className="catalog-results-shell">
      <CatalogSkeleton />
    </div>
  </div>
)

const CatalogContent = async ({
  searchParams,
}: Pick<PageProps<'/'>, 'searchParams'>) => {
  const resolvedSearchParams = await searchParams
  const { search } = resolvedSearchParams
  const rawQuery = Array.isArray(search) ? (search[0] ?? '') : (search ?? '')
  const query = normalizeSearchQuery(rawQuery)

  if (rawQuery !== query) {
    const currentSearchParams = new URLSearchParams()

    Object.entries(resolvedSearchParams).forEach(([name, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => currentSearchParams.append(name, entry))
      } else if (value !== undefined) {
        currentSearchParams.set(name, value)
      }
    })

    redirect(createCatalogUrl('/', currentSearchParams.toString(), query))
  }

  return (
    <CatalogExperience confirmedQuery={query}>
      <RecoverableErrorBoundary
        message="The catalog could not be displayed."
        title={query ? 'Search unavailable' : 'Catalog unavailable'}
      >
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogScaffold query={query} />
        </Suspense>
      </RecoverableErrorBoundary>
    </CatalogExperience>
  )
}

export default function CatalogPage({ searchParams }: PageProps<'/'>) {
  return (
    <ViewTransition
      name="product-route"
      share="product-route-fade"
      enter="product-route-fade"
      exit="product-route-fade"
      default="none"
    >
      <section aria-labelledby="catalog-heading" className="catalog-shell">
        <h1 className="sr-only" id="catalog-heading">
          Smartphone catalog
        </h1>
        <Suspense fallback={<CatalogPageSkeleton />}>
          <CatalogContent searchParams={searchParams} />
        </Suspense>
      </section>
    </ViewTransition>
  )
}
