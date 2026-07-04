import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Computes the statically-known runtime value of a key expression.
 *
 * Resolves expressions whose runtime value can be determined without
 * evaluation: literals (including bigint), template literals without
 * expressions, unary minus over numeric or bigint literals, unary plus over
 * numeric literals, `void` expressions and the `undefined` identifier. Regex
 * literals are excluded because each evaluation produces a distinct object.
 *
 * The value is wrapped in an object so that a statically-known `null` or
 * `undefined` value can be distinguished from "not statically known".
 *
 * @example
 *
 * ```ts
 * // Key expression: 0x10
 * computeStaticKeyValue(node) // Returns: { value: 16 }
 * ```
 *
 * @example
 *
 * ```ts
 * // Key expression: `a${x}`
 * computeStaticKeyValue(node) // Returns: null
 * ```
 *
 * @param node - Key expression to resolve.
 * @returns Wrapped static value, or null if the value is not statically known.
 */
export function computeStaticKeyValue(
  node: TSESTree.Node,
): { value: unknown } | null {
  switch (node.type) {
    case AST_NODE_TYPES.TemplateLiteral:
      return node.expressions.length === 0 ?
          { value: node.quasis[0]!.value.cooked }
        : null
    case AST_NODE_TYPES.UnaryExpression:
      return computeUnaryStaticKeyValue(node)
    case AST_NODE_TYPES.Identifier:
      return node.name === 'undefined' ? { value: undefined } : null
    case AST_NODE_TYPES.Literal:
      return 'regex' in node ? null : { value: node.value }
    default:
      return null
  }
}

/**
 * Computes the static value of a unary expression.
 *
 * `void` expressions always evaluate to `undefined` regardless of their
 * operand. Unary minus resolves over numeric or bigint literals, and unary plus
 * over numeric literals (unary plus over a bigint throws at runtime).
 *
 * @param node - Unary expression to resolve.
 * @returns Wrapped static value, or null if the value is not statically known.
 */
function computeUnaryStaticKeyValue(
  node: TSESTree.UnaryExpression,
): { value: unknown } | null {
  switch (node.operator) {
    case 'void':
      return { value: undefined }
    case '-':
      return computeNegatedStaticKeyValue(node)
    case '+':
      return (
          node.argument.type === AST_NODE_TYPES.Literal &&
            typeof node.argument.value === 'number'
        ) ?
          { value: node.argument.value }
        : null
    default:
      return null
  }
}

/**
 * Computes the static value of a unary minus expression over a numeric or
 * bigint literal.
 *
 * @param node - Unary expression to resolve.
 * @returns Wrapped negated value, or null if the value is not statically known.
 */
function computeNegatedStaticKeyValue(
  node: TSESTree.UnaryExpression,
): { value: unknown } | null {
  if (node.operator !== '-' || node.argument.type !== AST_NODE_TYPES.Literal) {
    return null
  }
  let { value } = node.argument
  if (typeof value === 'number') {
    return { value: -value }
  }
  if (typeof value === 'bigint') {
    return { value: -value }
  }
  return null
}
