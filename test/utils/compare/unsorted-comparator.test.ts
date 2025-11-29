import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../../types/sorting-node'

import { unsortedComparator } from '../../../utils/compare/unsorted-comparator'

describe('unsorted-comparator', () => {
  it.each([
    { aName: 'a', bName: 'b' },
    { aName: 'b', bName: 'a' },
  ])('should always return 0', ({ aName, bName }) => {
    let result = unsortedComparator(
      buildTestNode({ name: aName }),
      buildTestNode({ name: bName }),
    )

    expect(result).toBe(0)
  })

  function buildTestNode({ name }: { name: string }): SortingNode {
    return {
      name,
    } as SortingNode
  }
})
