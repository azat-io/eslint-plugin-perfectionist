import { describe, expect, it, vi } from 'vitest'

import type { OptionsByGroupIndexComputer } from '../../utils/sort-nodes-by-groups'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { sortNodesByGroups } from '../../utils/sort-nodes-by-groups'
import { getGroupIndex } from '../../utils/get-group-index'

vi.mock('../../utils/get-group-index', () => ({
  getGroupIndex: vi.fn(),
}))

describe('sort-nodes-by-groups subgroup-order', () => {
  let options: CommonGroupsOptions<unknown, unknown, TypeOption> &
    CommonOptions<TypeOption> = {
    fallbackSort: { type: 'subgroup-order' },
    specialCharacters: 'keep',
    newlinesBetween: 'ignore',
    newlinesInside: 'ignore',
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

  it('handles newlinesBetween group entries', () => {
    let getGroupIndexMock = vi.mocked(getGroupIndex)
    getGroupIndexMock.mockReturnValue(1)

    let nodeA = createTestNode({ group: 'group-a', name: 'same' })
    let nodeB = createTestNode({ group: 'group-b', name: 'same' })

    expect(
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        groups: ['group-a', { newlinesBetween: 1 }, 'group-b'],
        ignoreEslintDisabledNodes: false,
        optionsByGroupIndexComputer,
        nodes: [nodeA, nodeB],
      }),
    ).toStrictEqual([nodeA, nodeB])
  })

  it('ignores nodes missing from the subgroup order', () => {
    let getGroupIndexMock = vi.mocked(getGroupIndex)
    getGroupIndexMock.mockReturnValue(0)
    options = {
      ...options,
      subgroupOrder: ['group-a', 'group-b'],
    }

    let nodeA = createTestNode({ group: 'group-c', name: 'same' })
    let nodeB = createTestNode({ group: 'group-b', name: 'same' })

    expect(
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        ignoreEslintDisabledNodes: false,
        groups: [['group-a', 'group-b']],
        optionsByGroupIndexComputer,
        nodes: [nodeA, nodeB],
      }),
    ).toStrictEqual([nodeA, nodeB])
  })

  it('respects fallback sort order', () => {
    let getGroupIndexMock = vi.mocked(getGroupIndex)
    getGroupIndexMock.mockReturnValue(0)
    options = {
      ...options,
      fallbackSort: { type: 'subgroup-order', order: 'desc' },
      subgroupOrder: ['group-a', 'group-b'],
    }

    let nodeA = createTestNode({ group: 'group-a', name: 'same' })
    let nodeB = createTestNode({ group: 'group-b', name: 'same' })

    expect(
      sortNodesByGroups({
        comparatorByOptionsComputer: defaultComparatorByOptionsComputer,
        ignoreEslintDisabledNodes: false,
        groups: [['group-a', 'group-b']],
        optionsByGroupIndexComputer,
        nodes: [nodeA, nodeB],
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
      node: {} as SortingNode['node'],
      isEslintDisabled: false,
      partitionId: 0,
      size: 0,
      ...node,
      ...additionalParameters,
    } as SortingNode & T
  }
})
