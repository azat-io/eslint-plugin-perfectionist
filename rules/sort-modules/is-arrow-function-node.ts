import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { isPropertyOrAccessorNode } from './is-property-or-accessor-node'

/**
 * Checks whether a node is a property or accessor node with an
 * ArrowFunctionExpression value.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a property or accessor node with an
 *   ArrowFunctionExpression value, false otherwise.
 */
export function isArrowFunctionNode(
  node: TSESTree.Node,
): node is TSESTree.PropertyDefinition | TSESTree.AccessorProperty {
  return (
    isPropertyOrAccessorNode(node) &&
    node.value !== null &&
    node.value.type === AST_NODE_TYPES.ArrowFunctionExpression
  )
}
