import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'

describe('sort-nodes-by-groups', () => {
  let compareOptions = {
    fallbackSort: { type: 'unsorted' },
    specialCharacters: 'keep',
    type: 'alphabetical',
    ignoreCase: false,
    locales: 'en-US',
    order: 'asc',
  } as const

  it('sorts nodes by groups', () => {
    let nodeA = createTestNode({ group: 'group2', name: 'a' })
    let nodeB = createTestNode({ group: 'group1', name: 'b' })
    let nodeC = createTestNode({ group: 'group2', name: 'c' })
    let nodeD = createTestNode({ group: 'group1', name: 'd' })
    expect(
      sortNodesByGroups([nodeD, nodeC, nodeB, nodeA], {
        ...compareOptions,
        groups: ['group1', 'group2'],
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
        sortNodesByGroups(
          [nodeD, nodeC, nodeB, nodeA],
          {
            ...compareOptions,
            groups: ['group1', 'group2'],
          },
          {
            ignoreEslintDisabledNodes: true,
          },
        ),
      ).toStrictEqual([nodeB, nodeC, nodeD, nodeA])
    })

    it('should not ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is false', () => {
      expect(
        sortNodesByGroups(
          [nodeD, nodeC, nodeB, nodeA],
          {
            ...compareOptions,
            groups: ['group1', 'group2'],
          },
          {
            ignoreEslintDisabledNodes: false,
          },
        ),
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
        sortNodesByGroups(
          [nodeD, nodeC, nodeB, nodeA],
          {
            ...compareOptions,
            groups: ['group1', 'group2'],
          },
          {
            isNodeIgnored: node => node === nodeC,
            ignoreEslintDisabledNodes: false,
          },
        ),
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
        sortNodesByGroups(
          [nodeF, nodeE, nodeD, nodeC, nodeB, nodeA],
          {
            ...compareOptions,
            groups: ['group1', 'group2'],
          },
          {
            isNodeIgnoredForGroup: node => node === nodeB,
            ignoreEslintDisabledNodes: false,
          },
        ),
      ).toStrictEqual([nodeD, nodeF, nodeB, nodeA, nodeC, nodeE])
    })
  })

  let createTestNode = (node: {
    isEslintDisabled?: boolean
    group?: string
    name: string
  }): SortingNode => node as SortingNode
})
