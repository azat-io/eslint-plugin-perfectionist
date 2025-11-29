import { describe, expect, it } from 'vitest'

import type { OptionsByGroupIndexComputer } from '../../utils/sort-nodes-by-groups'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'

describe('sort-nodes-by-groups', () => {
  let options: CommonGroupsOptions<unknown, unknown, TypeOption> &
    CommonOptions<TypeOption> = {
    fallbackSort: { type: 'unsorted' },
    specialCharacters: 'keep',
    newlinesBetween: 'ignore',
    type: 'alphabetical',
    ignoreCase: false,
    locales: 'en-US',
    customGroups: [],
    order: 'asc',
    alphabet: '',
    groups: [],
  }

  let optionsByGroupIndexComputer: OptionsByGroupIndexComputer<
    CommonGroupsOptions<unknown, unknown, TypeOption> &
      CommonOptions<TypeOption>
  > = () => options

  it('sorts nodes by groups', () => {
    let nodeA = createTestNode({ group: 'group2', name: 'a' })
    let nodeB = createTestNode({ group: 'group1', name: 'b' })
    let nodeC = createTestNode({ group: 'group2', name: 'c' })
    let nodeD = createTestNode({ group: 'group1', name: 'd' })
    expect(
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        nodes: [nodeD, nodeC, nodeB, nodeA],
        ignoreEslintDisabledNodes: false,
        groups: ['group1', 'group2'],
        optionsByGroupIndexComputer,
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
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          nodes: [nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: true,
          groups: ['group1', 'group2'],
          optionsByGroupIndexComputer,
        }),
      ).toStrictEqual([nodeB, nodeC, nodeD, nodeA])
    })

    it('should not ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is false', () => {
      expect(
        sortNodesByGroups({
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          nodes: [nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: false,
          groups: ['group1', 'group2'],
          optionsByGroupIndexComputer,
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
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          isNodeIgnored: node => node === nodeC,
          nodes: [nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: false,
          groups: ['group1', 'group2'],
          optionsByGroupIndexComputer,
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
          comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
          isNodeIgnoredForGroup: ({ node }) => node === nodeB,
          nodes: [nodeF, nodeE, nodeD, nodeC, nodeB, nodeA],
          ignoreEslintDisabledNodes: false,
          groups: ['group1', 'group2'],
          optionsByGroupIndexComputer,
        }),
      ).toStrictEqual([nodeD, nodeF, nodeB, nodeA, nodeC, nodeE])
    })
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
