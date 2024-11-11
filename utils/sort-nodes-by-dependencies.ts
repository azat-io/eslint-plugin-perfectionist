import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

export interface SortingNodeWithDependencies<
  Node extends TSESTree.Node = TSESTree.Node,
> extends SortingNode<Node> {
  /**
   * Custom name used to check if a node is a dependency of another node. If unspecified, defaults to the SortingNode's name.
   */
  dependencyName?: string
  dependencies: string[]
}

interface ExtraOptions {
  ignoreEslintDisabledNodes?: boolean
}

/**
 * Returns nodes topologically sorted by their dependencies
 */
export let sortNodesByDependencies = <T extends SortingNodeWithDependencies>(
  nodes: T[],
  extraOptions?: ExtraOptions,
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
        !extraOptions?.ignoreEslintDisabledNodes ||
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
 * Returns the first node that is dependent on the given node, but is not
 * ordered before it
 */
export let getFirstUnorderedNodeDependentOn = <
  T extends SortingNodeWithDependencies,
>(
  node: T,
  currentlyOrderedNodes: T[],
): undefined | T => {
  let nodesDependentOnNode = currentlyOrderedNodes.filter(
    currentlyOrderedNode =>
      currentlyOrderedNode.dependencies.includes(
        node.dependencyName ?? node.name,
      ),
  )
  return nodesDependentOnNode.find(firstNodeDependentOnNode => {
    let currentIndexOfNode = currentlyOrderedNodes.indexOf(node)
    let currentIndexOfFirstNodeDependentOnNode = currentlyOrderedNodes.indexOf(
      firstNodeDependentOnNode,
    )
    return currentIndexOfFirstNodeDependentOnNode < currentIndexOfNode
  })
}
