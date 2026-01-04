import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../../types/sorting-node'

import { defaultComparatorByOptionsComputer } from '../../../utils/compare/default-comparator-by-options-computer'

describe('default-comparator-by-options-computer', () => {
  it('returns a comparator for subgroup-order', () => {
    let comparator = defaultComparatorByOptionsComputer({
      fallbackSort: { type: 'unsorted' },
      specialCharacters: 'keep',
      type: 'subgroup-order',
      ignoreCase: false,
      locales: 'en-US',
      order: 'asc',
      alphabet: '',
    })

    expect(comparator(createTestNode('a'), createTestNode('b'))).toBe(0)
  })

  function createTestNode(name: string): SortingNode {
    return {
      node: {} as SortingNode['node'],
      isEslintDisabled: false,
      partitionId: 0,
      group: 'group',
      size: 0,
      name,
    }
  }
})
