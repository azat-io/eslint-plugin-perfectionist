import { describe, expect, it } from 'vitest'

import type { BaseSortNodesByGroupsOptions } from '../../utils/sort-nodes-by-groups'
import type { SortingNode } from '../../types/sorting-node'

import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'

describe('sort-nodes-by-groups', () => {
  let options: BaseSortNodesByGroupsOptions = {
    fallbackSort: { type: 'unsorted' },
    specialCharacters: 'keep',
    type: 'alphabetical',
    ignoreCase: false,
    locales: 'en-US',
    order: 'asc',
    alphabet: '',
  } as const
  let getOptionsByGroupIndex: () => {
    options: BaseSortNodesByGroupsOptions
  } = () => ({ options })

  it('sorts nodes by groups', () => {
    let nodeA = createTestNode({ group: 'group2', name: 'a' })
    let nodeB = createTestNode({ group: 'group1', name: 'b' })
    let nodeC = createTestNode({ group: 'group2', name: 'c' })
    let nodeD = createTestNode({ group: 'group1', name: 'd' })
    expect(
      sortNodesByGroups({
        nodes: [nodeD, nodeC, nodeB, nodeA],
        ignoreEslintDisabledNodes: false,
        groups: ['group1', 'group2'],
        getOptionsByGroupIndex,
      }),
    ).toStrictEqual([nodeB, nodeD, nodeA, nodeC])
  })

  describe('ignoreEslintDisabledNodes', () => {
    let nodeA = createTestNode({ group: 'group2', name: 'a' })
    let nodeB = createTestNode({ group: 'group1', name: 'b' })
    let nodeC = createTestNode({
      isEslintDisabled: true,
      name: 'group2',
      group: 'c',
    })
    let nodeD = createTestNode({ group: 'group1', name: 'd' })

    it('should ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is true', () => {
      expect(
        sortNodesByGroups({
          nodes: [nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: true,
          groups: ['group1', 'group2'],
          getOptionsByGroupIndex,
        }),
      ).toStrictEqual([nodeB, nodeC, nodeD, nodeA])
    })

    it('should not ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is false', () => {
      expect(
        sortNodesByGroups({
          nodes: [nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: false,
          groups: ['group1', 'group2'],
          getOptionsByGroupIndex,
        }),
      ).toStrictEqual([nodeB, nodeD, nodeA, nodeC])
    })
  })

  describe('isNodeIgnored', () => {
    it('should ignore a node if "isNodeIgnored(node)" is true', () => {
      let nodeA = createTestNode({ group: 'group2', name: 'a' })
      let nodeB = createTestNode({ group: 'group1', name: 'b' })
      let nodeC = createTestNode({ group: 'group2', name: 'c' })
      let nodeD = createTestNode({ group: 'group1', name: 'd' })
      expect(
        sortNodesByGroups({
          isNodeIgnored: node => node === nodeC,
          nodes: [nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: false,
          groups: ['group1', 'group2'],
          getOptionsByGroupIndex,
        }),
      ).toStrictEqual([nodeB, nodeC, nodeD, nodeA])
    })
  })

  describe('isNodeIgnoredForGroup', () => {
    it('should ignore a node for a given group if "isNodeIgnoredForGroup(node, ...)" is true', () => {
      let nodeA = createTestNode({ group: 'group2', name: 'a' })
      let nodeB = createTestNode({ group: 'group1', name: 'b' })
      let nodeC = createTestNode({ group: 'group2', name: 'c' })
      let nodeD = createTestNode({ group: 'group1', name: 'd' })
      let nodeE = createTestNode({ group: 'group2', name: 'e' })
      let nodeF = createTestNode({ group: 'group1', name: 'f' })
      expect(
        sortNodesByGroups({
          nodes: [nodeF, nodeE, nodeD, nodeC, nodeB, nodeA],
          isNodeIgnoredForGroup: node => node === nodeB,
          ignoreEslintDisabledNodes: false,
          groups: ['group1', 'group2'],
          getOptionsByGroupIndex,
        }),
      ).toStrictEqual([nodeD, nodeF, nodeB, nodeA, nodeC, nodeE])
    })
  })

  it('should handle "nodeValueGetter"', () => {
    let nodeA = createTestNode(
      { group: 'group1', name: 'a' },
      { actualValue: 'b' },
    )
    let nodeB = createTestNode(
      { group: 'group1', name: 'a' },
      { actualValue: 'a' },
    )
    expect(
      sortNodesByGroups({
        getOptionsByGroupIndex: () => ({
          nodeValueGetter: node => node.actualValue,
          options,
        }),
        ignoreEslintDisabledNodes: false,
        nodes: [nodeA, nodeB],
        groups: ['group1'],
      }),
    ).toStrictEqual([nodeB, nodeA])
  })

  it('should handle "fallbackSortNodeValueGetter"', () => {
    let nodeA = createTestNode(
      { group: 'group1', name: 'a' },
      { actualValue: 'b' },
    )
    let nodeB = createTestNode(
      { group: 'group1', name: 'a' },
      { actualValue: 'a' },
    )
    expect(
      sortNodesByGroups({
        getOptionsByGroupIndex: () => ({
          options: {
            ...options,
            fallbackSort: {
              type: 'alphabetical',
            },
          },
          fallbackSortNodeValueGetter: node => node.actualValue,
        }),
        ignoreEslintDisabledNodes: false,
        nodes: [nodeA, nodeB],
        groups: ['group1'],
      }),
    ).toStrictEqual([nodeB, nodeA])
  })

  function createTestNode<T extends object>(
    node: {
      isEslintDisabled?: boolean
      group: string
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
