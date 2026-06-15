import type { TSESLint } from '@typescript-eslint/utils'

import type { Comparator } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortModulesSortingNode, SortModulesNode } from './types'

import { populateSortingNodeGroupsWithDependencies } from '../../utils/populate-sorting-node-groups-with-dependencies'
import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { isNodeDependentOnOtherNode } from '../../utils/is-node-dependent-on-other-node'
import { buildSortingNodeByNodeMap } from '../../utils/build-sorting-node-by-node-map'
import { sortNodesByDependencies } from '../../utils/sort-nodes-by-dependencies'
import { computeDependencies } from './compute-dependencies'

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
 * @param params.useExperimentalDependencyDetection - Whether to use
 *   experimental dependency detection.
 * @param params.sourceCode - The source code object.
 * @returns A comparator function for sorting module nodes by usage.
 */
export function buildUsageComparator({
  useExperimentalDependencyDetection,
  ignoreEslintDisabledNodes,
  sortingNodes,
  sourceCode,
}: {
  useExperimentalDependencyDetection: boolean
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): Comparator<SortModulesSortingNode> {
  let { updatedSortingNodeByNode, orderByUnsortedNode, orderBySortedNode } =
    buildOrderByNodeMaps({
      useExperimentalDependencyDetection,
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

    /**
     * The dependency direction must not be flipped by `options.order`: the
     * unconditional forward-topological post-pass (`sortNodesByDependencies` in
     * `sort-modules.ts`) owns the dependency direction. Negating the
     * dependency-resolved index here would fight that post-pass and make the
     * autofix oscillate forever (see issue #739). Only the sign (direction) of
     * the index difference matters to a comparator.
     */
    let sortedOrderedValue = sortedOrderA - sortedOrderB
    let unsortedOrderedValue = unsortedOrderA - unsortedOrderB

    if (Math.sign(sortedOrderedValue) !== Math.sign(unsortedOrderedValue)) {
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
  useExperimentalDependencyDetection,
  ignoreEslintDisabledNodes,
  sortingNodes,
  sourceCode,
}: {
  useExperimentalDependencyDetection: boolean
  sortingNodes: SortModulesSortingNode[]
  ignoreEslintDisabledNodes: boolean
  sourceCode: TSESLint.SourceCode
}): {
  updatedSortingNodeByNode: Map<SortModulesNode, PartialSortModulesSortingNode>
  orderByUnsortedNode: Map<SortModulesNode, number>
  orderBySortedNode: Map<SortModulesNode, number>
} {
  let sortingNodesWithUpdatedDependencies
  if (useExperimentalDependencyDetection) {
    let dependenciesBySortingNode = computeDependenciesBySortingNode({
      dependencyDetection: 'soft',
      sortingNodes,
      sourceCode,
    })
    sortingNodesWithUpdatedDependencies =
      populateSortingNodeGroupsWithDependencies({
        sortingNodeGroups: [sortingNodes],
        dependenciesBySortingNode,
      })[0]!
  } else {
    sortingNodesWithUpdatedDependencies = sortingNodes.map(
      computeSortingNodeWithUpdatedDependencies,
    )
  }

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

  /**
   * Computes a sorting node with updated dependencies.
   *
   * @deprecated - To remove when experimental dependency detection is the only
   *   option.
   * @param params - The parameters object.
   * @returns The sorting node populated with updated dependencies.
   */
  function computeSortingNodeWithUpdatedDependencies({
    isEslintDisabled,
    dependencyNames,
    node,
  }: SortModulesSortingNode): Pick<
    SortModulesSortingNode,
    'isEslintDisabled' | 'dependencyNames' | 'dependencies' | 'node'
  > {
    let dependencies = computeDependencies(node, { type: 'soft' })
    let dependencyNamesSet = new Set(dependencyNames)

    return {
      dependencies: dependencies.filter(
        dependency => !dependencyNamesSet.has(dependency),
      ),
      isEslintDisabled,
      dependencyNames,
      node,
    }
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
