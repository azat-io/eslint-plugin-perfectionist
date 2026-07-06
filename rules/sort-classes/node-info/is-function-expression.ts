import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Checks whether a node is a function expression or an arrow function
 * expression.
 *
 * @param node - The AST node to check.
 * @returns Whether the node is a function expression.
 */
export function isFunctionExpression(
  node: TSESTree.Node | null,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
  if (!node) {
    return false
  }
  return (
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression
  )
}
