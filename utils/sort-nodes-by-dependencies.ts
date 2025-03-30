import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'

export interface SortingNodeWithDependencies<
  Node extends TSESTree.Node = TSESTree.Node,
> extends SortingNode<Node> {
  /**
   * Custom name used to check if a node is a dependency of another node. If
   * unspecified, defaults to the SortingNode's name.
   */
  dependencyName?: string
  /** List of dependencies for the node */
  dependencies: string[]
}

interface ExtraOptions {
  ignoreEslintDisabledNodes: boolean
}

/**
 * Returns nodes topologically sorted by their dependencies.
 * @param {SortingNodeWithDependencies[]} nodes - The nodes to sort.
 * @param {ExtraOptions} [extraOptions] - Additional sorting options.
 * @returns {SortingNodeWithDependencies[]} The nodes sorted in topological
 * order.
 */
export let sortNodesByDependencies = <T extends SortingNodeWithDependencies>(
  nodes: T[],
  extraOptions: ExtraOptions,
): T[] => {
  let result: T[] = []
  let visitedNodes = new Set<T>()
  let inProcessNodes = new Set<T>()

  let visitNode = (sortingNode: T): void => {
    if (visitedNodes.has(sortingNode)) {
      return
    }
    if (inProcessNodes.has(sortingNode)) {
      // Circular dependency
      return
    }
    inProcessNodes.add(sortingNode)

    let dependentNodes = nodes.filter(({ dependencyName, name }) =>
      sortingNode.dependencies.includes(dependencyName ?? name),
    )
    for (let dependentNode of dependentNodes) {
      if (
        !extraOptions.ignoreEslintDisabledNodes ||
        !dependentNode.isEslintDisabled
      ) {
        visitNode(dependentNode)
      }
    }
    visitedNodes.add(sortingNode)
    inProcessNodes.delete(sortingNode)
    result.push(sortingNode)
  }

  for (let node of nodes) {
    visitNode(node)
  }

  return result
}

/**
 * Returns the first node that is dependent on the given node but is not ordered
 * before it.
 * @param {object} params - The parameters for the operation
 * @param {SortingNodeWithDependencies} params.node - The node to check dependencies
 * for.
 * @param {SortingNodeWithDependencies[]} params.nodes - The list of
 * nodes currently ordered.
 * @returns {SortingNodeWithDependencies | undefined} The first unordered
 * dependent node, or `undefined` if none found.
 */
export let getFirstUnorderedNodeDependentOn = <
  T extends SortingNodeWithDependencies,
>({
  nodes,
  node,
}: {
  nodes: T[]
  node: T
}): undefined | T => {
  let nodesDependentOnNode = nodes.filter(currentlyOrderedNode =>
    currentlyOrderedNode.dependencies.includes(
      node.dependencyName ?? node.name,
    ),
  )
  return nodesDependentOnNode.find(firstNodeDependentOnNode => {
    let currentIndexOfNode = nodes.indexOf(node)
    let currentIndexOfFirstNodeDependentOnNode = nodes.indexOf(
      firstNodeDependentOnNode,
    )
    return currentIndexOfFirstNodeDependentOnNode < currentIndexOfNode
  })
}
