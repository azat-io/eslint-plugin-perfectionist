import type { CommonOptions } from '../types/common-options'
import type { NodeValueGetterFunction } from './compare'
import type { SortingNode } from '../types/sorting-node'

import { compare } from './compare'

interface SortNodesParameters<T extends SortingNode> {
  fallbackSortNodeValueGetter?: NodeValueGetterFunction<T> | null
  options: { maxLineLength?: number } & CommonOptions
  nodeValueGetter?: NodeValueGetterFunction<T> | null
  ignoreEslintDisabledNodes: boolean
  isNodeIgnored?(node: T): boolean
  nodes: T[]
}

export let sortNodes = <T extends SortingNode>({
  fallbackSortNodeValueGetter,
  ignoreEslintDisabledNodes,
  nodeValueGetter,
  isNodeIgnored,
  options,
  nodes,
}: SortNodesParameters<T>): T[] => {
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

  let sortedNodes = [...nonIgnoredNodes].sort((a, b) =>
    compare({
      fallbackSortNodeValueGetter,
      nodeValueGetter,
      options,
      a,
      b,
    }),
  )

  // Add ignored nodes at the same position as they were before linting.
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
