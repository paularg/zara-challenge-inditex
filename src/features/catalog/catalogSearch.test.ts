import { describe, expect, it } from 'vitest'

import { createCatalogUrl, normalizeSearchQuery } from './catalogSearch'

describe('Catalog search URL', () => {
  it('normalizes surrounding whitespace', () => {
    expect(normalizeSearchQuery('  Galaxy S24  ')).toBe('Galaxy S24')
  })

  it('sets a normalized search while preserving unrelated parameters', () => {
    expect(createCatalogUrl('/', 'campaign=summer', '  Samsung  ')).toBe(
      '/?campaign=summer&search=Samsung',
    )
  })

  it('removes an empty search without leaving a trailing question mark', () => {
    expect(createCatalogUrl('/', 'search=Samsung', '   ')).toBe('/')
  })
})
