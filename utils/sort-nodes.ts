import type { ComparatorByOptionsComputer } from './compare/default-comparator-by-options-computer'
import type { CommonOptions } from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'

import { computeComparators } from './compare/compute-comparators'

/**
 * Parameters for the core sorting operation.
 *
 * @template Node - Type of sorting node.
 * @template Options - Sorting options type extending common options.
 */
interface SortNodesParameters<
  Node extends SortingNode,
  Options extends Pick<CommonOptions, 'fallbackSort'>,
> {
  comparatorByOptionsComputer: ComparatorByOptionsComputer<Options, Node>
  isNodeIgnored?(node: Node): boolean
  ignoreEslintDisabledNodes: boolean
  options: Options
  nodes: Node[]
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
 * @param params - Parameters for sorting operation.
 * @returns Sorted array with ignored nodes preserved at original positions.
 */
export function sortNodes<
  Node extends SortingNode,
  Options extends Pick<CommonOptions, 'fallbackSort'>,
>({
  comparatorByOptionsComputer,
  ignoreEslintDisabledNodes,
  isNodeIgnored,
  options,
  nodes,
}: SortNodesParameters<Node, Options>): Node[] {
  let nonIgnoredNodes: Node[] = []
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

  let comparators = computeComparators(comparatorByOptionsComputer, options)

  let sortedNodes = [...nonIgnoredNodes].toSorted((a, b) => {
    for (let comparator of comparators) {
      let result = comparator(a, b)
      if (result) {
        return result
      }
    }
    return 0
  })

  /* Add ignored nodes at the same position as they were before linting. */
  for (let ignoredIndex of ignoredNodeIndices) {
    sortedNodes.splice(ignoredIndex, 0, nodes[ignoredIndex]!)
  }

  return sortedNodes
}
