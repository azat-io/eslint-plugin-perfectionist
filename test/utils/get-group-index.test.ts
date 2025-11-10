import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { getGroupIndex } from '../../utils/get-group-index'

describe('get-group-index', () => {
  it('should return the first index matching a string group', () => {
    expect(
      getGroupIndex(['group', ['group']], createSortingNode('group')),
    ).toBe(0)
  })

  it('should return the first index matching a string array group', () => {
    expect(
      getGroupIndex([['group'], 'group'], createSortingNode('group')),
    ).toBe(0)
  })

  function createSortingNode(group: string): SortingNode {
    return { group } as SortingNode
  }
})
