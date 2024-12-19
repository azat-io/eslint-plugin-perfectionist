import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../typings'

export let createNodeIndexMap = <Node extends TSESTree.Node>(
  nodes: SortingNode<Node>[],
): Map<SortingNode, number> => {
  let nodeIndexMap = new Map<SortingNode<Node>, number>()
  for (let [index, node] of nodes.entries()) {
    nodeIndexMap.set(node, index)
  }
  return nodeIndexMap
}
