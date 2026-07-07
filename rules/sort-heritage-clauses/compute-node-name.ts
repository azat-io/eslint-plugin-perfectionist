import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Extracts the name from a heritage clause expression.
 *
 * For simple identifiers, returns the name directly. For member expressions
 * (like `Namespace.Class`), extracts the innermost property name.
 *
 * @param expression - The heritage clause expression AST node.
 * @returns The extracted name string from the expression.
 */
export function computeNodeName(
  expression: TSESTree.PrivateIdentifier | TSESTree.Expression,
): string {
  let currentExpression = expression
  while ('property' in currentExpression) {
    currentExpression = currentExpression.property
  }
  /* v8 ignore else -- @preserve Exhaustive guard for unsupported expressions. */
  if (currentExpression.type === AST_NODE_TYPES.Identifier) {
    return currentExpression.name
  }
  /* v8 ignore next -- @preserve Should never throw. */
  throw new Error(
    'Unexpected heritage clause expression. Please report this issue ' +
      'here: https://github.com/azat-io/eslint-plugin-perfectionist/issues',
  )
}
