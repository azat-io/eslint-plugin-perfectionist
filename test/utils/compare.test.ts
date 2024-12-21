import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { Alphabet } from '../../utils/alphabet'
import { compare } from '../../utils/compare'

describe('compare', () => {
  describe('alphabetical', () => {
    let compareOptions = {
      specialCharacters: 'keep',
      type: 'alphabetical',
      ignoreCase: false,
      locales: 'en-US',
      order: 'asc',
    } as const

    it('sorts by order asc', () => {
      expect(
        compare(
          createTestNode({ name: 'b' }),
          createTestNode({ name: 'a' }),
          compareOptions,
        ),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare(createTestNode({ name: 'a' }), createTestNode({ name: 'b' }), {
          ...compareOptions,
          order: 'desc',
        }),
      ).toBe(1)
    })

    it('sorts ignoring case', () => {
      expect(
        compare(
          createTestNode({ name: 'aB' }),
          createTestNode({ name: 'Ab' }),
          {
            ...compareOptions,
            ignoreCase: true,
          },
        ),
      ).toBe(0)
    })

    it('sorts while trimming special characters', () => {
      expect(
        compare(createTestNode({ name: '_a' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
          specialCharacters: 'trim',
        }),
      ).toBe(0)
    })

    it('sorts while removing special characters', () => {
      expect(
        compare(
          createTestNode({ name: 'ab' }),
          createTestNode({ name: 'a_b' }),
          {
            ...compareOptions,
            specialCharacters: 'remove',
          },
        ),
      ).toBe(0)
    })
  })

  describe('natural', () => {
    let compareOptions = {
      specialCharacters: 'keep',
      ignoreCase: false,
      locales: 'en-US',
      type: 'natural',
      order: 'asc',
    } as const

    it('sorts by order asc', () => {
      expect(
        compare(
          createTestNode({ name: 'b' }),
          createTestNode({ name: 'a' }),
          compareOptions,
        ),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare(createTestNode({ name: 'a' }), createTestNode({ name: 'b' }), {
          ...compareOptions,
          order: 'desc',
        }),
      ).toBe(1)
    })

    it('sorts ignoring case', () => {
      expect(
        compare(
          createTestNode({ name: 'aB' }),
          createTestNode({ name: 'Ab' }),
          {
            ...compareOptions,
            ignoreCase: true,
          },
        ),
      ).toBe(0)
    })

    it('sorts while trimming special characters', () => {
      expect(
        compare(createTestNode({ name: '_a' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
          specialCharacters: 'trim',
        }),
      ).toBe(0)
    })

    it('sorts while removing special characters', () => {
      expect(
        compare(
          createTestNode({ name: 'ab' }),
          createTestNode({ name: 'a_b' }),
          {
            ...compareOptions,
            specialCharacters: 'remove',
          },
        ),
      ).toBe(0)
    })
  })

  describe('line-length', () => {
    let compareOptions = {
      specialCharacters: 'keep',
      type: 'line-length',
      ignoreCase: false,
      locales: 'en-US',
      order: 'desc',
    } as const

    it('sorts by order asc', () => {
      expect(
        compare(createTestNode({ name: 'b' }), createTestNode({ name: 'aa' }), {
          ...compareOptions,
          order: 'asc',
        }),
      ).toBe(-1)
    })

    it('sorts by order desc', () => {
      expect(
        compare(
          createTestNode({ name: 'aa' }),
          createTestNode({ name: 'b' }),
          compareOptions,
        ),
      ).toBe(-1)
    })
  })

  describe('custom', () => {
    let compareOptions = {
      alphabet: Alphabet.generateRecommendedAlphabet()
        .sortByLocaleCompare('en-US')
        .getCharacters(),
      specialCharacters: 'keep',
      ignoreCase: false,
      locales: 'en-US',
      type: 'custom',
      order: 'asc',
    } as const

    it('sorts by order asc', () => {
      expect(
        compare(
          createTestNode({ name: 'b' }),
          createTestNode({ name: 'a' }),
          compareOptions,
        ),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare(createTestNode({ name: 'a' }), createTestNode({ name: 'b' }), {
          ...compareOptions,
          order: 'desc',
        }),
      ).toBe(1)
    })

    it('sorts ignoring case', () => {
      expect(
        compare(
          createTestNode({ name: 'aB' }),
          createTestNode({ name: 'Ab' }),
          {
            ...compareOptions,
            ignoreCase: true,
          },
        ),
      ).toBe(0)
    })

    it('sorts while trimming special characters', () => {
      expect(
        compare(createTestNode({ name: '_a' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
          specialCharacters: 'trim',
        }),
      ).toBe(0)
    })

    it('sorts while removing special characters', () => {
      expect(
        compare(
          createTestNode({ name: 'ab' }),
          createTestNode({ name: 'a_b' }),
          {
            ...compareOptions,
            specialCharacters: 'remove',
          },
        ),
      ).toBe(0)
    })

    it('gives minimum priority to characters not in the alphabet', () => {
      expect(
        compare(createTestNode({ name: 'a' }), createTestNode({ name: 'b' }), {
          ...compareOptions,
          alphabet: 'b',
        }),
      ).toBe(1)
      expect(
        compare(createTestNode({ name: 'b' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
          alphabet: 'b',
        }),
      ).toBe(-1)
      expect(
        compare(createTestNode({ name: 'b' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
          alphabet: 'c',
        }),
      ).toBe(0)
    })

    it('gives maximum priority to void', () => {
      expect(
        compare(createTestNode({ name: 'a' }), createTestNode({ name: '' }), {
          ...compareOptions,
          alphabet: 'a',
        }),
      ).toBe(1)
      expect(
        compare(createTestNode({ name: '' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
          alphabet: 'a',
        }),
      ).toBe(-1)
    })
  })

  let createTestNode = ({ name }: { name: string }): SortingNode =>
    ({
      size: name.length,
      name,
    }) as SortingNode
})
