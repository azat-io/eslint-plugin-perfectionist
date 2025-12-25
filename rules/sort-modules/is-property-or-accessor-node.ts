import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

/**
 * Checks whether a node is a PropertyDefinition or AccessorProperty.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a PropertyDefinition or AccessorProperty, false
 *   otherwise.
 */
export function isPropertyOrAccessorNode(
  node: TSESTree.Node,
): node is TSESTree.PropertyDefinition | TSESTree.AccessorProperty {
  return (
    node.type === AST_NODE_TYPES.PropertyDefinition ||
    node.type === AST_NODE_TYPES.AccessorProperty
  )
}
