import type { SortingNode } from '../types/sorting-node'

/**
 * Builds a map from nodes to their corresponding sorting nodes.
 *
 * @param sortingNodes - An array of sorting nodes.
 * @returns A map where each key is a node and the value is its sorting node.
 */
export function buildSortingNodeByNodeMap<T extends Pick<SortingNode, 'node'>>(
  sortingNodes: T[],
): Map<T['node'], T> {
  let sortingNodeByNode = new Map<T['node'], T>()
  for (let sortingNode of sortingNodes) {
    sortingNodeByNode.set(sortingNode.node, sortingNode)
  }
  return sortingNodeByNode
}
