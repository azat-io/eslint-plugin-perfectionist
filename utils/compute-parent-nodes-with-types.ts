import type { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import type { NodeOfType } from '../types/node-of-type'

/**
 * Finds all parent nodes matching one of the specified AST node types.
 *
 * @param options - Options for the search.
 * @param options.allowedTypes - Array of AST node types to match.
 * @param options.consecutiveOnly - If true, stops searching after the first
 *   non-matching parent node is found.
 * @param options.node - Starting node to search from.
 * @param options.maxParent - Optional maximum exclusive parent node to stop the
 *   search at.
 * @returns List of matching parent nodes.
 */
export function computeParentNodesWithTypes<NodeType extends AST_NODE_TYPES>({
  consecutiveOnly,
  allowedTypes,
  maxParent,
  node,
}: {
  maxParent: TSESTree.Node | null
  consecutiveOnly: boolean
  allowedTypes: NodeType[]
  node: TSESTree.Node
}): NodeOfType<NodeType>[] {
  let allowedTypesSet = new Set<string>(allowedTypes)
  let returnValue: NodeOfType<NodeType>[] = []

  let { parent } = node
  while (parent) {
    if (parent === maxParent) {
      break
    }
    if (allowedTypesSet.has(parent.type)) {
      returnValue.push(parent as NodeOfType<NodeType>)
    } else if (consecutiveOnly) {
      break
    }
    ;({ parent } = parent)
  }

  return returnValue
}
