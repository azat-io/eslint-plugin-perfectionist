import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../typings'

import { compare } from '../utils/compare'

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
        compare(createTestNode({ name: 'b' }), createTestNode({ name: 'a' }), {
          ...compareOptions,
        }),
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

  let createTestNode = ({ name }: { name: string }): SortingNode =>
    ({
      name,
    }) as SortingNode
})
