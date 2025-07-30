import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../types/sorting-node'

import { computeNodesInCircularDependencies } from './compute-nodes-in-circular-dependencies'
import { isNodeDependentOnOtherNode } from './is-node-dependent-on-other-node'

export interface SortingNodeWithDependencies<
  Node extends TSESTree.Node = TSESTree.Node,
> extends SortingNode<Node> {
  dependencyNames: string[]
  dependencies: string[]
}

interface ExtraOptions {
  ignoreEslintDisabledNodes: boolean
}

/**
 * Returns nodes topologically sorted by their dependencies.
 *
 * @param {SortingNodeWithDependencies[]} nodes - The nodes to sort.
 * @param {ExtraOptions} [extraOptions] - Additional sorting options.
 * @returns {SortingNodeWithDependencies[]} The nodes sorted in topological
 *   order.
 */
export function sortNodesByDependencies<T extends SortingNodeWithDependencies>(
  nodes: T[],
  extraOptions: ExtraOptions,
): T[] {
  let nodesInCircularDependencies = computeNodesInCircularDependencies(nodes)

  let result: T[] = []
  let visitedNodes = new Set<T>()

  function visitNode(sortingNode: T): void {
    if (visitedNodes.has(sortingNode)) {
      return
    }

    let dependentNodes = nodes
      .filter(node => !nodesInCircularDependencies.has(node))
      .filter(node => isNodeDependentOnOtherNode(node, sortingNode))

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
