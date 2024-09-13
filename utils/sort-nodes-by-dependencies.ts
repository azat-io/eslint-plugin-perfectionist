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

export let nodeDependsOn = (
  left: SortingNodeWithDependencies,
  right: SortingNodeWithDependencies,
): boolean => left.dependencies.includes(right.dependencyName ?? right.name)

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
    let dependentNodes = nodes.filter(n => nodeDependsOn(node, n))
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

export let getFirstUnorderedDependency = (
  node: SortingNodeWithDependencies,
  currentlyOrderedNodes: SortingNodeWithDependencies[],
  expectedOrderedNodes: SortingNodeWithDependencies[],
): SortingNodeWithDependencies | null => {
  let currentIndexOfNode = currentlyOrderedNodes.indexOf(node)
  let expectedIndexOfNode = expectedOrderedNodes.indexOf(node)
  for (let dependency of node.dependencies) {
    let dependencyNode = currentlyOrderedNodes.find(
      currentNode =>
        (currentNode.dependencyName ?? currentNode.name) === dependency,
    )
    if (dependencyNode) {
      let currentIndexOfDependency =
        currentlyOrderedNodes.indexOf(dependencyNode)
      let expectedIndexOfDependency =
        expectedOrderedNodes.indexOf(dependencyNode)
      if (
        currentIndexOfDependency > currentIndexOfNode &&
        expectedIndexOfDependency < expectedIndexOfNode
      ) {
        return dependencyNode
      }
    }
  }
  return null
}
