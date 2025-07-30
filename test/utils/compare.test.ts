import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { Alphabet } from '../../utils/alphabet'
import { compare } from '../../utils/compare'

describe('compare', () => {
  describe('alphabetical', () => {
    let options = {
      fallbackSort: { type: 'unsorted' } as const,
      specialCharacters: 'keep' as const,
      type: 'alphabetical' as const,
      locales: 'en-US' as const,
      order: 'asc' as const,
      ignoreCase: false,
      alphabet: '',
    }

    it('sorts by order asc', () => {
      expect(
        compare({
          b: createTestNode({ name: 'a' }),
          a: createTestNode({ name: 'b' }),
          options,
        }),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare({
          options: {
            ...options,
            order: 'desc',
          },
          a: createTestNode({ name: 'a' }),
          b: createTestNode({ name: 'b' }),
        }),
      ).toBe(1)
    })

    it('sorts ignoring case', () => {
      expect(
        compare({
          options: {
            ...options,
            ignoreCase: true,
          },
          a: createTestNode({ name: 'aB' }),
          b: createTestNode({ name: 'Ab' }),
        }),
      ).toBe(0)
    })

    it('sorts while trimming special characters', () => {
      expect(
        compare({
          options: {
            ...options,
            specialCharacters: 'trim',
          },
          a: createTestNode({ name: '_a' }),
          b: createTestNode({ name: 'a' }),
        }),
      ).toBe(0)
    })

    it('sorts while removing special characters', () => {
      expect(
        compare({
          options: {
            ...options,
            specialCharacters: 'remove',
          },
          b: createTestNode({ name: 'a_b' }),
          a: createTestNode({ name: 'ab' }),
        }),
      ).toBe(0)
    })
  })

  describe('natural', () => {
    let options = {
      fallbackSort: { type: 'unsorted' } as const,
      specialCharacters: 'keep' as const,
      locales: 'en-US' as const,
      type: 'natural' as const,
      order: 'asc' as const,
      ignoreCase: false,
      alphabet: '',
    }

    it('sorts by order asc', () => {
      expect(
        compare({
          b: createTestNode({ name: 'a' }),
          a: createTestNode({ name: 'b' }),
          options,
        }),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare({
          options: {
            ...options,
            order: 'desc',
          },
          a: createTestNode({ name: 'a' }),
          b: createTestNode({ name: 'b' }),
        }),
      ).toBe(1)
    })

    it('sorts ignoring case', () => {
      expect(
        compare({
          options: {
            ...options,
            ignoreCase: true,
          },
          a: createTestNode({ name: 'aB' }),
          b: createTestNode({ name: 'Ab' }),
        }),
      ).toBe(0)
    })

    it('sorts while trimming special characters', () => {
      expect(
        compare({
          options: {
            ...options,
            specialCharacters: 'trim',
          },
          a: createTestNode({ name: '_a' }),
          b: createTestNode({ name: 'a' }),
        }),
      ).toBe(0)
    })

    it('sorts while removing special characters', () => {
      expect(
        compare({
          options: {
            ...options,
            specialCharacters: 'remove',
          },
          b: createTestNode({ name: 'a_b' }),
          a: createTestNode({ name: 'ab' }),
        }),
      ).toBe(0)
    })
  })

  describe('line-length', () => {
    let compareOptions = {
      fallbackSort: { type: 'unsorted' } as const,
      specialCharacters: 'keep' as const,
      type: 'line-length' as const,
      locales: 'en-US' as const,
      order: 'desc' as const,
      ignoreCase: false,
      alphabet: '',
    }

    it('sorts by order asc', () => {
      expect(
        compare({
          options: {
            ...compareOptions,
            order: 'desc',
          },
          b: createTestNode({ name: 'aa' }),
          a: createTestNode({ name: 'b' }),
        }),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare({
          options: {
            ...compareOptions,
            order: 'desc',
          },
          a: createTestNode({ name: 'aa' }),
          b: createTestNode({ name: 'b' }),
        }),
      ).toBe(-1)
    })
  })

  describe('custom', () => {
    let options = {
      alphabet: Alphabet.generateRecommendedAlphabet()
        .sortByLocaleCompare('en-US')
        .getCharacters(),
      fallbackSort: { type: 'unsorted' } as const,
      specialCharacters: 'keep' as const,
      locales: 'en-US' as const,
      type: 'custom' as const,
      order: 'asc' as const,
      ignoreCase: false,
    }

    it('sorts by order asc', () => {
      expect(
        compare({
          b: createTestNode({ name: 'a' }),
          a: createTestNode({ name: 'b' }),
          options,
        }),
      ).toBe(1)
    })

    it('sorts by order desc', () => {
      expect(
        compare({
          options: {
            ...options,
            order: 'desc',
          },
          a: createTestNode({ name: 'a' }),
          b: createTestNode({ name: 'b' }),
        }),
      ).toBe(1)
    })

    it('sorts ignoring case', () => {
      expect(
        compare({
          options: {
            ...options,
            ignoreCase: true,
          },
          a: createTestNode({ name: 'aB' }),
          b: createTestNode({ name: 'Ab' }),
        }),
      ).toBe(0)
    })

    it('sorts while trimming special characters', () => {
      expect(
        compare({
          options: {
            ...options,
            specialCharacters: 'trim',
          },
          a: createTestNode({ name: '_a' }),
          b: createTestNode({ name: 'a' }),
        }),
      ).toBe(0)
    })

    it('sorts while removing special characters', () => {
      expect(
        compare({
          options: {
            ...options,
            specialCharacters: 'remove',
          },
          b: createTestNode({ name: 'a_b' }),
          a: createTestNode({ name: 'ab' }),
        }),
      ).toBe(0)
    })

    it('gives minimum priority to characters not in the alphabet', () => {
      expect(
        compare({
          options: {
            ...options,
            alphabet: 'b',
          },
          a: createTestNode({ name: 'a' }),
          b: createTestNode({ name: 'b' }),
        }),
      ).toBe(1)

      expect(
        compare({
          options: {
            ...options,
            alphabet: 'b',
          },
          b: createTestNode({ name: 'a' }),
          a: createTestNode({ name: 'b' }),
        }),
      ).toBe(-1)
    })

    it('gives maximum priority to void', () => {
      expect(
        compare({
          options: {
            ...options,
            alphabet: 'a',
          },
          a: createTestNode({ name: 'a' }),
          b: createTestNode({ name: '' }),
        }),
      ).toBe(1)
      expect(
        compare({
          options: {
            ...options,
            alphabet: 'a',
          },
          b: createTestNode({ name: 'a' }),
          a: createTestNode({ name: '' }),
        }),
      ).toBe(-1)
    })
  })

  describe('unsorted', () => {
    let compareOptions = {
      fallbackSort: { type: 'unsorted' } as const,
      specialCharacters: 'keep' as const,
      type: 'unsorted' as const,
      locales: 'en-US' as const,
      order: 'desc' as const,
      ignoreCase: false,
      alphabet: '',
    }

    it('does not sort', () => {
      expect(
        compare({
          a: createTestNode({ name: 'b' }),
          b: createTestNode({ name: 'a' }),
          options: compareOptions,
        }),
      ).toBe(0)
    })
  })

  describe('"nodeValueGetter"', () => {
    let options = {
      specialCharacters: 'keep' as const,
      type: 'alphabetical' as const,
      locales: 'en-US' as const,
      order: 'asc' as const,
      ignoreCase: false,
      alphabet: '',
    }

    it('sorts using the "nodeValueGetter"', () => {
      let a = createTestNode({
        additionalProperties: { value: 'b' },
        name: 'a',
      })
      let b = createTestNode({
        additionalProperties: { value: 'a' },
        name: 'b',
      })
      expect(
        compare({
          options: {
            ...options,
            fallbackSort: { type: 'unsorted' },
          },
          nodeValueGetter: node =>
            'value' in node ? (node.value as string) : '',
          a,
          b,
        }),
      ).toBe(1)
    })
  })

  describe('fallback sorting', () => {
    let options = {
      specialCharacters: 'keep' as const,
      type: 'line-length' as const,
      locales: 'en-US' as const,
      order: 'desc' as const,
      ignoreCase: false,
      alphabet: '',
    }

    it('sorts using the fallback configuration', () => {
      let a = createTestNode({ name: 'aaa' })
      let b = createTestNode({ name: 'bbb' })
      expect(
        compare({
          options: {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
              order: 'asc',
            },
          },
          a: b,
          b: a,
        }),
      ).toBe(1)

      expect(
        compare({
          options: {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
              order: 'desc',
            },
          },
          a: b,
          b: a,
        }),
      ).toBe(-1)

      expect(
        compare({
          options: {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
            },
          },
          a: b,
          b: a,
        }),
      ).toBe(-1)
    })

    it('handles `fallbackSort.nodeValueGetter`', () => {
      let a = createTestNode({
        additionalProperties: { value: 'b' },
        name: 'aaa',
      })
      let b = createTestNode({
        additionalProperties: { value: 'a' },
        name: 'bbb',
      })
      expect(
        compare({
          options: {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
              order: 'asc',
            },
          },
          fallbackSortNodeValueGetter: node =>
            'value' in node ? (node.value as string) : '',
          a,
          b,
        }),
      ).toBe(1)
    })

    it("doesn't sort using the fallback configuration more than once", () => {
      let node = createTestNode({ name: 'aaa' })
      let duplicateNode = createTestNode({ name: 'aaa' })
      expect(
        compare({
          options: {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
              order: 'asc',
            } as const,
          },
          b: duplicateNode,
          a: node,
        }),
      ).toBe(0)
    })
  })

  function createTestNode({
    additionalProperties,
    name,
  }: {
    additionalProperties?: object
    name: string
  }): SortingNode {
    return {
      size: name.length,
      name,
      ...additionalProperties,
    } as SortingNode
  }
})
