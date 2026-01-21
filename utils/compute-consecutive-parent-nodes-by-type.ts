import type { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { NodeOfType } from '../types/node-of-type'

export function computeConsecutiveParentNodesByType<
  NodeType extends AST_NODE_TYPES,
>(startingNode: TSESTree.Node, nodeType: NodeType): NodeOfType<NodeType>[] {
  let returnValue: NodeOfType<NodeType>[] = []

  let { parent } = startingNode
  while (parent) {
    if (parent.type !== nodeType) {
      break
    }
    returnValue.push(parent as NodeOfType<NodeType>)
    ;({ parent } = parent)
  }

  return returnValue
}
