import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Computes array elements for the given expression.
 *
 * @param expression - The expression to compute array elements from.
 * @returns An array of elements if the expression is an array or a new
 *   expression, otherwise null.
 */
export function computeArrayElements(
  expression: TSESTree.CallExpressionArgument,
): (TSESTree.SpreadElement | TSESTree.Expression | null)[] | null {
  switch (expression.type) {
    case AST_NODE_TYPES.ArrayExpression:
      return expression.elements
    case AST_NODE_TYPES.NewExpression:
      if (expression.callee.type !== AST_NODE_TYPES.Identifier) {
        return null
      }
      if (expression.callee.name !== 'Array') {
        return null
      }
      return expression.arguments
    default:
      return null
  }
}
