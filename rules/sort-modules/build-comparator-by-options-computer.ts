import type { TSESTree } from '@typescript-eslint/types'

import type {
  ComparatorByOptionsComputer,
  Comparator,
} from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, SortModulesOptions } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { computeDependencies } from './compute-dependencies'

export function buildComparatorByOptionsComputer({
  ignoreEslintDisabledNodes,
  sortingNodes,
}: {
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): ComparatorByOptionsComputer<
  Required<SortModulesOptions[number]>,
  SortModulesSortingNode
> {
  return options => {
    switch (options.type) {
      case 'subgroup-order':
      case 'alphabetical':
      case 'line-length':
      case 'unsorted':
      case 'natural':
      case 'custom':
        return defaultComparatorByOptionsComputer({
          ...options,
          type: options.type,
        })
      case 'usage':
        return buildUsageComparator({
          ignoreEslintDisabledNodes,
          sortingNodes,
          options,
        })
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(options.type)
    }
  }
}

function buildUsageComparator({
  ignoreEslintDisabledNodes,
  sortingNodes,
  options,
}: {
  options: Required<SortModulesOptions[number]>
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): Comparator<SortModulesSortingNode> {
  let orderByNode = buildOrderByNodeMap()
  return (a, b) => {
    let nodeA = a.node
    let nodeB = b.node

    let orderA = orderByNode.get(nodeA)!
    let orderB = orderByNode.get(nodeB)!

    return computeOrderedValue(orderA - orderB, options.order)
  }

  function buildOrderByNodeMap(): Map<TSESTree.ProgramStatement, number> {
    let sortingNodesWithUpdatedDependencies = sortingNodes.map(
      ({ isEslintDisabled, dependencyNames, node }) => ({
        dependencies: computeDependencies(node, { type: 'soft' }),
        isEslintDisabled,
        dependencyNames,
        node,
      }),
    )
    let sortedSortingNodes = sortNodesByDependencies(
      sortingNodesWithUpdatedDependencies,
      { ignoreEslintDisabledNodes },
    )

    let orderByNodeMap = new Map<TSESTree.ProgramStatement, number>()
    for (let [i, { node }] of sortedSortingNodes.entries()) {
      orderByNodeMap.set(node, i)
    }

    return orderByNodeMap
  }
}
