import { describe, expect, it } from 'vitest'

import { compareNaturally } from '../../../utils/compare/compare-naturally'

describe('natural', () => {
  let options = {
    specialCharacters: 'keep' as const,
    locales: 'en-US' as const,
    order: 'asc' as const,
    ignoreCase: false,
  }

  it('sorts by order asc', () => {
    let result = compareNaturally('a', 'b', options)

    expect(result).toBe(-1)
  })

  it('sorts by order desc', () => {
    let result = compareNaturally('a', 'b', {
      ...options,
      order: 'desc',
    })

    expect(result).toBe(1)
  })

  it('sorts ignoring case', () => {
    let result = compareNaturally('aB', 'ab', {
      ...options,
      ignoreCase: true,
    })

    expect(result).toBe(0)
  })

  it('sorts while trimming special characters', () => {
    let result = compareNaturally('_a', 'a', {
      ...options,
      specialCharacters: 'trim',
    })

    expect(result).toBe(0)
  })

  it('sorts while removing special characters', () => {
    let result = compareNaturally('a_b', 'ab', {
      ...options,
      specialCharacters: 'remove',
    })

    expect(result).toBe(0)
  })
})
