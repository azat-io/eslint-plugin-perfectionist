import { describe, expect, it } from 'vitest'

import { computeOrderedValue } from '../../../utils/compare/compute-ordered-value'

describe('compute-ordered-value', () => {
  it("returns the value if order is 'asc'", () => {
    let result = computeOrderedValue(42, 'asc')

    expect(result).toBe(42)
  })

  it("returns the negated value if order is 'desc'", () => {
    let result = computeOrderedValue(42, 'desc')

    expect(result).toBe(-42)
  })
})
