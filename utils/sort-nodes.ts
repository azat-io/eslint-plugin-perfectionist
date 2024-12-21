import type { SortingNode } from '../types/sorting-node'
import type { CompareOptions } from './compare'

import { compare } from './compare'

interface ExtraOptions {
  ignoreEslintDisabledNodes?: boolean
}

export let sortNodes = <T extends SortingNode>(
  nodes: T[],
  options: CompareOptions<T>,
  extraOptions?: ExtraOptions,
): T[] => {
  let nonIgnoredNodes: T[] = []
  let ignoredNodeIndices: number[] = []
  for (let [index, sortingNode] of nodes.entries()) {
    if (
      sortingNode.isEslintDisabled &&
      extraOptions?.ignoreEslintDisabledNodes
    ) {
      ignoredNodeIndices.push(index)
    } else {
      nonIgnoredNodes.push(sortingNode)
    }
  }

  let sortedNodes = [...nonIgnoredNodes].sort((a, b) => compare(a, b, options))

  // Add ignored nodes at the same position as they were before linting
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex])
  }

  return sortedNodes
}
