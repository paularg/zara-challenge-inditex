export const normalizeSearchQuery = (query: string): string => query.trim()

export const createCatalogUrl = (
  pathname: string,
  searchParams: string,
  query: string,
): string => {
  const nextParams = new URLSearchParams(searchParams)
  const normalizedQuery = normalizeSearchQuery(query)

  if (normalizedQuery) {
    nextParams.set('search', normalizedQuery)
  } else {
    nextParams.delete('search')
  }

  const nextSearch = nextParams.toString()
  return nextSearch ? `${pathname}?${nextSearch}` : pathname
}
