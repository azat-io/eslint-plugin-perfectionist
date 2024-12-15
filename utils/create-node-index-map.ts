import type { SortingNode } from '../typings'

export let createNodeIndexMap = (
  nodes: SortingNode[],
): Map<SortingNode, number> => {
  let nodeIndexMap = new Map<SortingNode, number>()
  for (let [index, node] of nodes.entries()) {
    nodeIndexMap.set(node, index)
  }
  return nodeIndexMap
}
