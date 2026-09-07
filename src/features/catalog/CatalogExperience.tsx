'use client'

import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'

import { Button } from '@/components/ui/button'

import { createCatalogUrl, normalizeSearchQuery } from './catalogSearch'

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_INPUT_ID = 'product-search'

type CatalogSearchContextValue = {
  clearSearch: () => void
}

const CatalogSearchContext = createContext<CatalogSearchContextValue | null>(
  null,
)

type CatalogExperienceProps = {
  children: ReactNode
  confirmedQuery: string
}

export const CatalogExperience = ({
  children,
  confirmedQuery,
}: CatalogExperienceProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const inputRef = useRef<HTMLInputElement>(null)
  const lastRequestedQueryRef = useRef<string>(confirmedQuery)
  const [query, setQuery] = useState(confirmedQuery)
  const [isPending, startTransition] = useTransition()

  const replaceQuery = useCallback(
    (nextQuery: string) => {
      const nextUrl = createCatalogUrl(pathname, searchParamsString, nextQuery)

      lastRequestedQueryRef.current = nextQuery
      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    },
    [pathname, router, searchParamsString],
  )

  useEffect(() => {
    if (lastRequestedQueryRef.current === confirmedQuery) {
      lastRequestedQueryRef.current = ''
      return
    }

    lastRequestedQueryRef.current = ''
    setQuery(confirmedQuery)
  }, [confirmedQuery])

  useEffect(() => {
    const nextQuery = normalizeSearchQuery(query)

    if (nextQuery === confirmedQuery) {
      return
    }

    const timeout = window.setTimeout(() => {
      replaceQuery(nextQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [confirmedQuery, query, replaceQuery])

  const clearSearch = useCallback(() => {
    setQuery('')
    replaceQuery('')
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }, [replaceQuery])

  return (
    <CatalogSearchContext.Provider value={{ clearSearch }}>
      <div className="catalog-experience">
        <div className="catalog-search-shell">
          <div className="catalog-search-field">
            <label className="sr-only" htmlFor={SEARCH_INPUT_ID}>
              Search Products
            </label>
            <input
              autoComplete="off"
              className="catalog-search-input"
              id={SEARCH_INPUT_ID}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a smartphone..."
              ref={inputRef}
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="Clear search"
                className="catalog-clear-button focus-outline"
                onClick={clearSearch}
                type="button"
              >
                <Image
                  aria-hidden="true"
                  alt=""
                  height={20}
                  src="/assets/close-small.svg"
                  width={20}
                />
              </button>
            ) : null}
          </div>
          <p
            aria-atomic="true"
            aria-label="Search status"
            className="sr-only"
            role="status"
          >
            {isPending ? 'Searching Products' : ''}
          </p>
        </div>
        <div
          aria-busy={isPending}
          className="catalog-results-shell"
          data-pending={isPending ? '' : undefined}
        >
          {children}
        </div>
      </div>
    </CatalogSearchContext.Provider>
  )
}

export const CatalogClearSearchButton = () => {
  const context = useContext(CatalogSearchContext)

  if (!context) {
    throw new Error(
      'CatalogClearSearchButton must be rendered inside CatalogExperience.',
    )
  }

  return (
    <Button onClick={context.clearSearch} type="button" variant="outline">
      Clear search
    </Button>
  )
}
