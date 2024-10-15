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

/**
 * Returns nodes topologically sorted by their dependencies
 */
export let sortNodesByDependencies = <T extends SortingNodeWithDependencies>(
  nodes: T[],
): T[] => {
  let result: T[] = []
  let visitedNodes = new Set<T>()
  let inProcessNodes = new Set<T>()

  let visitNode = (node: T) => {
    if (visitedNodes.has(node)) {
      return
    }
    if (inProcessNodes.has(node)) {
      // Circular dependency
      return
    }
    inProcessNodes.add(node)
    let dependentNodes = nodes.filter(n =>
      node.dependencies.includes(n.dependencyName ?? n.name),
    )
    for (let dependentNode of dependentNodes) {
      visitNode(dependentNode)
    }
    visitedNodes.add(node)
    inProcessNodes.delete(node)
    result.push(node)
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
