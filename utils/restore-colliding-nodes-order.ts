import type { SortingNode } from '../types/sorting-node'

/**
 * Restores the source order of colliding nodes within a sorted list.
 *
 * For each collision group, its members re-occupy exactly the positions they
 * hold in the sorted list, but in source order. All other nodes keep their
 * sorted positions. This guarantees that members whose keys collide at runtime
 * never cross each other, preserving last-write-wins semantics, while
 * non-colliding members still sort fully.
 *
 * The returned array is a pure permutation of `sortedNodes`: node identities
 * are unchanged, so index maps and fixes derived from the result stay
 * consistent.
 *
 * @example
 *
 * ```ts
 * // Source order: [b: 1, b() {}, a: 0]
 * // Sorted order: [b() {}, a: 0, b: 1]
 * restoreCollidingNodesOrder({
 *   collidingNodeGroups: [[bProperty, bMethod]],
 *   sortedNodes: [bMethod, aProperty, bProperty],
 * })
 * // Returns: [bProperty, aProperty, bMethod]
 * ```
 *
 * @template T - Type of sorting node.
 * @param params - Parameters for order restoration.
 * @param params.collidingNodeGroups - Groups of colliding nodes in source
 *   order.
 * @param params.sortedNodes - Nodes produced by the sorting pipeline.
 * @returns Sorted nodes with each collision group restored to source order.
 */
export function restoreCollidingNodesOrder<T extends SortingNode>({
  collidingNodeGroups,
  sortedNodes,
}: {
  collidingNodeGroups: T[][]
  sortedNodes: T[]
}): T[] {
  let result = [...sortedNodes]
  for (let collidingNodeGroup of collidingNodeGroups) {
    let collidingNodes = new Set(collidingNodeGroup)
    let sortedIndices: number[] = []
    for (let [index, node] of result.entries()) {
      if (collidingNodes.has(node)) {
        sortedIndices.push(index)
      }
    }
    for (let [nodeIndex, sortedIndex] of sortedIndices.entries()) {
      result[sortedIndex] = collidingNodeGroup[nodeIndex]!
    }
  }
  return result
}
