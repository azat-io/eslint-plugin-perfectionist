import { describe, expect, it } from 'vitest'

import type { SortingNode } from '../../types/sorting-node'

import { sortNodes } from '../../utils/sort-nodes'

describe('sort-nodes', () => {
  let compareOptions = {
    fallbackSort: { type: 'unsorted' },
    specialCharacters: 'keep',
    type: 'alphabetical',
    ignoreCase: false,
    locales: 'en-US',
    order: 'asc',
  } as const

  it('sorts nodes', () => {
    let a = createTestNode({ name: 'a' })
    let b = createTestNode({ name: 'b' })
    expect(sortNodes([b, a], compareOptions)).toStrictEqual([a, b])
  })

  describe('ignoreEslintDisabledNodes', () => {
    let nodeA = createTestNode({ name: 'a' })
    let nodeB = createTestNode({ name: 'b' })
    let nodeC = createTestNode({ isEslintDisabled: true, name: 'c' })

    it('should ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is true', () => {
      expect(
        sortNodes([nodeB, nodeC, nodeA], compareOptions, {
          ignoreEslintDisabledNodes: true,
        }),
      ).toStrictEqual([nodeA, nodeC, nodeB])
    })

    it('should not ignore eslint disabled nodes if "ignoreEslintDisabledNodes" is false', () => {
      expect(
        sortNodes([nodeB, nodeC, nodeA], compareOptions, {
          ignoreEslintDisabledNodes: false,
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
        sortNodes([nodeB, nodeC, nodeA], compareOptions, {
          isNodeIgnored: node => node === nodeC,
          ignoreEslintDisabledNodes: false,
        }),
      ).toStrictEqual([nodeA, nodeC, nodeB])
    })
  })

  let createTestNode = (node: {
    isEslintDisabled?: boolean
    name: string
  }): SortingNode => node as SortingNode
})
