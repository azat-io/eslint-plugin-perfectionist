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

  it('should handle "nodeValueGetter"', () => {
    let nodeA = createTestNode({ name: 'a' }, { actualValue: 'b' })
    let nodeB = createTestNode({ name: 'b' }, { actualValue: 'a' })
    expect(
      sortNodes({
        nodeValueGetter: node => node.actualValue,
        ignoreEslintDisabledNodes: false,
        nodes: [nodeA, nodeB],
        options,
      }),
    ).toStrictEqual([nodeB, nodeA])
  })

  it('should handle "fallbackSortNodeValueGetter"', () => {
    let nodeA = createTestNode({ name: 'a' }, { actualValue: 'b' })
    let nodeB = createTestNode({ name: 'a' }, { actualValue: 'a' })
    expect(
      sortNodes({
        options: {
          ...options,
          fallbackSort: {
            type: 'alphabetical',
          },
        },
        fallbackSortNodeValueGetter: node => node.actualValue,
        ignoreEslintDisabledNodes: false,
        nodes: [nodeA, nodeB],
      }),
    ).toStrictEqual([nodeB, nodeA])
  })

  let createTestNode = <T extends object>(
    node: {
      isEslintDisabled?: boolean
      name: string
    },
    additionalParameters?: T,
  ): SortingNode & T =>
    ({
      ...node,
      ...additionalParameters,
    }) as SortingNode & T
})
