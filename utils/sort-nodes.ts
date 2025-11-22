import type { CommonOptions } from '../types/common-options'
import type { NodeValueGetterFunction } from './compare'
import type { SortingNode } from '../types/sorting-node'

import { compare } from './compare'

/**
 * Parameters for the core sorting operation.
 *
 * @template T - Type of sorting node.
 */
interface SortNodesParameters<T extends SortingNode> {
  fallbackSortNodeValueGetter?: NodeValueGetterFunction<T> | null
  nodeValueGetter?: NodeValueGetterFunction<T> | null
  ignoreEslintDisabledNodes: boolean
  isNodeIgnored?(node: T): boolean
  options: CommonOptions
  nodes: T[]
}

/**
 * Core sorting function that performs the actual node sorting.
 *
 * This is the fundamental sorting engine of the Perfectionist plugin. It
 * handles the actual comparison and ordering of nodes while preserving the
 * positions of ignored elements. The function separates nodes into two
 * categories:
 *
 * 1. Nodes to be sorted (non-ignored)
 * 2. Nodes to keep in place (ignored or ESLint-disabled).
 *
 * After sorting, ignored nodes are reinserted at their original positions,
 * ensuring that intentionally placed elements remain untouched.
 *
 * @template T - Type of sorting node.
 * @param params - Parameters for sorting operation.
 * @returns Sorted array with ignored nodes preserved at original positions.
 */
export function sortNodes<T extends SortingNode>({
  fallbackSortNodeValueGetter,
  ignoreEslintDisabledNodes,
  nodeValueGetter,
  isNodeIgnored,
  options,
  nodes,
}: SortNodesParameters<T>): T[] {
  let nonIgnoredNodes: T[] = []
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      (sortingNode.isEslintDisabled && ignoreEslintDisabledNodes) ||
      isNodeIgnored?.(sortingNode)
    ) {
      ignoredNodeIndices.push(index)
    } else {
      nonIgnoredNodes.push(sortingNode)
    }
  }

  let sortedNodes = [...nonIgnoredNodes].toSorted((a, b) =>
    compare({
      fallbackSortNodeValueGetter,
      nodeValueGetter,
      options,
      a,
      b,
    }),
  )

  /* Add ignored nodes at the same position as they were before linting. */
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
