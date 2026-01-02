import type { TSESTree } from '@typescript-eslint/types'

import type { Comparator } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, SortModulesOptions } from './types'

import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'
import { computeDependencies } from './compute-dependencies'

/**
 * Builds a comparator function for sorting module nodes based on their usage.
 *
 * @param params - The parameters object.
 * @param params.ignoreEslintDisabledNodes - Whether to ignore ESLint disabled
 *   nodes.
 * @param params.sortingNodes - The module sorting nodes.
 * @param params.options - The sorting options.
 * @returns A comparator function for sorting module nodes by usage.
 */
export function buildUsageComparator({
  ignoreEslintDisabledNodes,
  sortingNodes,
  options,
}: {
  options: Required<SortModulesOptions[number]>
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): Comparator<SortModulesSortingNode> {
  let orderByNode = buildOrderByNodeMap({
    ignoreEslintDisabledNodes,
    sortingNodes,
  })
  return (a, b) => {
    let nodeA = a.node
    let nodeB = b.node

    let orderA = orderByNode.get(nodeA)!
    let orderB = orderByNode.get(nodeB)!

    return computeOrderedValue(orderA - orderB, options.order)
  }
}

function buildOrderByNodeMap({
  ignoreEslintDisabledNodes,
  sortingNodes,
}: {
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
}): Map<TSESTree.ProgramStatement, number> {
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
