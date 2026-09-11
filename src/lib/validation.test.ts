import { describe, expect, it } from 'vitest'

import { isNonEmptyString, isRecord } from './validation'

describe('validation', () => {
  it('recognizes object values', () => {
    expect(isRecord({ value: 'valid' })).toBe(true)
    expect(isRecord(null)).toBe(false)
    expect(isRecord('not an object')).toBe(false)
  })

  it('recognizes non-empty strings', () => {
    expect(isNonEmptyString('value')).toBe(true)
    expect(isNonEmptyString('')).toBe(false)
    expect(isNonEmptyString(1)).toBe(false)
  })
})
