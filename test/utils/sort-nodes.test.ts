import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { sortNodes } from '../../utils/sort-nodes'

describe('sort-nodes', () => {
  let options = {
    fallbackSort: { type: 'unsorted' },
    specialCharacters: 'keep',
    type: 'alphabetical',
    ignoreCase: false,
    locales: 'en-US',
    order: 'asc',
    alphabet: '',
  } as const

  it('sorts nodes', () => {
    let a = createTestNode({ name: 'a' })
    let b = createTestNode({ name: 'b' })
    expect(
      sortNodes({
        ignoreEslintDisabledNodes: false,
        nodes: [b, a],
        options,
      }),
    ).toStrictEqual([a, b])
  })

  describe('ignoreEslintDisabledNodes', () => {
    let nodeA = createTestNode({ name: 'a' })
    let nodeB = createTestNode({ name: 'b' })
    let nodeC = createTestNode({ isEslintDisabled: true, name: 'c' })

    it('should ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is true', () => {
      expect(
        sortNodes({
          ignoreEslintDisabledNodes: true,
          nodes: [nodeB, nodeC, nodeA],
          options,
        }),
      ).toStrictEqual([nodeA, nodeC, nodeB])
    })

    it('should not ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is false', () => {
      expect(
        sortNodes({
          ignoreEslintDisabledNodes: false,
          nodes: [nodeB, nodeC, nodeA],
          options,
        }),
      ).toStrictEqual([nodeA, nodeB, nodeC])
    })
  })

  describe('isNodeIgnored', () => {
    it('should ignore a node if "isNodeIgnored(node)" is true', () => {
      let nodeA = createTestNode({ name: 'a' })
      let nodeB = createTestNode({ name: 'b' })
      let nodeC = createTestNode({ name: 'c' })
      expect(
        sortNodes({
          isNodeIgnored: node => node === nodeC,
          ignoreEslintDisabledNodes: false,
          nodes: [nodeB, nodeC, nodeA],
          options,
        }),
      ).toStrictEqual([nodeA, nodeC, nodeB])
    })
  })

  function createTestNode<T extends object>(
    node: {
      isEslintDisabled?: boolean
      name: string
    },
    additionalParameters?: T,
  ): SortingNode & T {
    return {
      ...node,
      ...additionalParameters,
    } as SortingNode & T
  }
})
