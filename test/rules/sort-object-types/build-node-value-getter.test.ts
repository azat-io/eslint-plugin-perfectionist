import { describe, expect, it } from 'vitest'

import type { SortObjectTypesSortingNode } from '../../../rules/sort-object-types/types'

import { buildNodeValueGetter } from '../../../rules/sort-object-types/build-node-value-getter'

describe('build-node-value-getter', () => {
  it('returns null when "sortBy" is "name"', () => {
    let nodeValueGetter = buildNodeValueGetter('name')
    expect(nodeValueGetter).toBeNull()
  })

  describe('when "sortBy" is "value"', () => {
    let nodeValueGetter = buildNodeValueGetter('value')!

    it("nodeValueGetter should return the node's name if it exists", () => {
      expect(nodeValueGetter(createTestNode({ value: 'value' }))).toBe('value')
    })

    it("nodeValueGetter should return an empty string if the node's name is null", () => {
      expect(nodeValueGetter(createTestNode({ value: null }))).toBe('')
    })
  })

  function createTestNode({
    value,
  }: {
    value: string | null
  }): SortObjectTypesSortingNode {
    return {
      value,
    } as SortObjectTypesSortingNode
  }
})
