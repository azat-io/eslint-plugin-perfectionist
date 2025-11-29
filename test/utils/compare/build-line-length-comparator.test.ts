import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../../types/sorting-node'

import { buildLineLengthComparator } from '../../../utils/compare/build-line-length-comparator'

describe('build-line-length-comparator', () => {
  describe('asc order', () => {
    it('returns 1 if first node is longer', () => {
      let comparator = buildLineLengthComparator({
        order: 'asc',
      })

      let result = comparator(
        buildTestNode({ name: 'aa' }),
        buildTestNode({ name: 'b' }),
      )

      expect(result).toBe(1)
    })

    it('returns -1 if first node is shorter', () => {
      let comparator = buildLineLengthComparator({
        order: 'asc',
      })

      let result = comparator(
        buildTestNode({ name: 'b' }),
        buildTestNode({ name: 'aa' }),
      )

      expect(result).toBe(-1)
    })
  })

  describe('desc order', () => {
    it('returns -1 if first node is longer', () => {
      let comparator = buildLineLengthComparator({
        order: 'desc',
      })

      let result = comparator(
        buildTestNode({ name: 'aa' }),
        buildTestNode({ name: 'b' }),
      )

      expect(result).toBe(-1)
    })

    it('returns 1 if first node is shorter', () => {
      let comparator = buildLineLengthComparator({
        order: 'desc',
      })

      let result = comparator(
        buildTestNode({ name: 'b' }),
        buildTestNode({ name: 'aa' }),
      )

      expect(result).toBe(1)
    })
  })

  function buildTestNode({ name }: { name: string }): SortingNode {
    return {
      size: name.length,
    } as SortingNode
  }
})
