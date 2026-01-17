import type { TSESLint } from '@typescript-eslint/utils'

import type { Comparator } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, SortModulesNode, Options } from './types'

import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { isNodeDependentOnOtherNode } from '../../utils/is-node-dependent-on-other-node'
import { buildSortingNodeByNodeMap } from '../../utils/build-sorting-node-by-node-map'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'

type PartialSortModulesSortingNode = Pick<
  SortModulesSortingNode,
  'dependencyNames' | 'dependencies' | 'node'
>

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
  sourceCode,
  options,
}: {
  sortingNodes: SortModulesSortingNode[]
  options: Required<Options[number]>
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): Comparator<SortModulesSortingNode> {
  let { updatedSortingNodeByNode, orderByUnsortedNode, orderBySortedNode } =
    buildOrderByNodeMaps({
      ignoreEslintDisabledNodes,
      sortingNodes,
      sourceCode,
    })

  return (a, b) => {
    let nodeA = a.node
    let nodeB = b.node

    let sortedOrderA = orderBySortedNode.get(nodeA)!
    let unsortedOrderA = orderByUnsortedNode.get(nodeA)!
    let sortedOrderB = orderBySortedNode.get(nodeB)!
    let unsortedOrderB = orderByUnsortedNode.get(nodeB)!

    let sortedOrderedValue = computeOrderedValue(
      sortedOrderA - sortedOrderB,
      options.order,
    )
    let unsortedOrderedValue = computeOrderedValue(
      unsortedOrderA - unsortedOrderB,
      options.order,
    )

    if (sortedOrderedValue !== unsortedOrderedValue) {
      return sortedOrderedValue
    }

    let aWithUpdatedDependencies = updatedSortingNodeByNode.get(nodeA)!
    let bWithUpdatedDependencies = updatedSortingNodeByNode.get(nodeB)!
    if (
      isNodeDependentOnOtherNode(
        aWithUpdatedDependencies,
        bWithUpdatedDependencies,
      ) ||
      isNodeDependentOnOtherNode(
        bWithUpdatedDependencies,
        aWithUpdatedDependencies,
      )
    ) {
      return sortedOrderedValue
    }

    return 0
  }
}

function buildOrderByNodeMaps({
  ignoreEslintDisabledNodes,
  sortingNodes,
  sourceCode,
}: {
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): {
  updatedSortingNodeByNode: Map<SortModulesNode, PartialSortModulesSortingNode>
  orderByUnsortedNode: Map<SortModulesNode, number>
  orderBySortedNode: Map<SortModulesNode, number>
} {
  let dependenciesBySortingNode = computeDependenciesBySortingNode({
    dependencyDetection: 'soft',
    sortingNodes,
    sourceCode,
  })
  let sortingNodesWithUpdatedDependencies =
    populateSortingNodeGroupsWithDependencies({
      sortingNodeGroups: [sortingNodes],
      dependenciesBySortingNode,
    })[0]!

  let sortedSortingNodes = sortNodesByDependencies(
    sortingNodesWithUpdatedDependencies,
    { ignoreEslintDisabledNodes },
  )

  return {
    updatedSortingNodeByNode: buildSortingNodeByNodeMap(
      sortingNodesWithUpdatedDependencies,
    ),
    orderBySortedNode: buildOrderByNodeMap(sortedSortingNodes),
    orderByUnsortedNode: buildOrderByNodeMap(sortingNodes),
  }
}

function buildOrderByNodeMap(
  sortingNodes: PartialSortModulesSortingNode[],
): Map<SortModulesNode, number> {
  let returnValue = new Map<SortModulesNode, number>()
  for (let [i, { node }] of sortingNodes.entries()) {
    returnValue.set(node, i)
  }
  return returnValue
}
