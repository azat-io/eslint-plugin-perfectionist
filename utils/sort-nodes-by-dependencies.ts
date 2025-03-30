import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'

import { computeNodesInCircularDependencies } from './compute-nodes-in-circular-dependencies'

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
  let nodesInCircularDependencies = computeNodesInCircularDependencies(nodes)

  let result: T[] = []
  let visitedNodes = new Set<T>()

  let visitNode = (sortingNode: T): void => {
    if (visitedNodes.has(sortingNode)) {
      return
    }

    let dependentNodes = nodes
      .filter(dependentNode => !nodesInCircularDependencies.has(dependentNode))
      .filter(({ dependencyName, name }) =>
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
    result.push(sortingNode)
  }

  for (let node of nodes) {
    visitNode(node)
  }

  return result
}
