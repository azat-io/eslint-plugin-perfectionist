import { describe, expect, it } from 'vitest'

import { compareByCustomSort } from '../../../utils/compare/compare-by-custom-sort'
import { Alphabet } from '../../../utils/alphabet'

describe('compare-by-custom-sort', () => {
  let options = {
    alphabet: Alphabet.generateRecommendedAlphabet()
      .sortByLocaleCompare('en-US')
      .getCharacters(),
    specialCharacters: 'keep' as const,
    order: 'asc' as const,
    ignoreCase: false,
  }

  it('sorts by order asc', () => {
    let result = compareByCustomSort('a', 'b', options)

    expect(result).toBe(-1)
  })

  it('sorts by order desc', () => {
    let result = compareByCustomSort('a', 'b', {
      ...options,
      order: 'desc',
    })

    expect(result).toBe(1)
  })

  it('sorts ignoring case', () => {
    let result = compareByCustomSort('aB', 'Ab', {
      ...options,
      ignoreCase: true,
    })

    expect(result).toBe(0)
  })

  it('sorts while trimming special characters', () => {
    let result = compareByCustomSort('_a', 'a', {
      ...options,
      specialCharacters: 'trim',
    })

    expect(result).toBe(0)
  })

  it('sorts while removing special characters', () => {
    let result = compareByCustomSort('a_b', 'ab', {
      ...options,
      specialCharacters: 'remove',
    })

    expect(result).toBe(0)
  })

  it('gives minimum priority to characters not in the alphabet', () => {
    expect(
      compareByCustomSort('a', 'b', {
        ...options,
        alphabet: 'b',
      }),
    ).toBe(1)

    expect(
      compareByCustomSort('b', 'a', {
        ...options,
        alphabet: 'b',
      }),
    ).toBe(-1)
  })

  it.each([
    { expected: 1, a: 'a', b: '' },
    { expected: -1, b: 'a', a: '' },
  ])('gives maximum priority to void', ({ expected, a, b }) => {
    let result = compareByCustomSort(a, b, {
      ...options,
      alphabet: 'a',
    })

    expect(result).toBe(expected)
  })
})
