import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Extracts a numeric value from an AST expression node.
 *
 * Handles literal numbers, binary expressions, and unary expressions
 * recursively to compute the final numeric value.
 *
 * @param expression - The AST node to evaluate.
 * @returns The numeric value of the expression, or null if not evaluable.
 */
export function computeExpressionNumberValue(
  expression: TSESTree.Node,
): number | null {
  switch (expression.type) {
    case AST_NODE_TYPES.BinaryExpression:
      return computeBinaryExpressionNumberValue(
        expression.left,
        expression.right,
        expression.operator,
      )
    case AST_NODE_TYPES.UnaryExpression:
      return computeUnaryExpressionNumberValue(
        expression.argument,
        expression.operator,
      )
    case AST_NODE_TYPES.Literal:
      return typeof expression.value === 'number' ? expression.value : null
    default:
      return null
  }
}

/**
 * Evaluates a binary expression to compute its numeric value.
 *
 * Supports arithmetic operators (+, -, *, /, %, **), bitwise operators (|, &,
 * ^, <<, >>), and returns null for unsupported expressions.
 *
 * @param leftExpression - The left operand of the binary expression.
 * @param rightExpression - The right operand of the binary expression.
 * @param operator - The operator string (e.g., '+', '-', '*', '|').
 * @returns The computed numeric value, or null if it cannot be evaluated.
 */
function computeBinaryExpressionNumberValue(
  leftExpression: TSESTree.PrivateIdentifier | TSESTree.Expression,
  rightExpression: TSESTree.Expression,
  operator: string,
): number | null {
  let left = computeExpressionNumberValue(leftExpression)
  let right = computeExpressionNumberValue(rightExpression)
  if (left === null || right === null) {
    return null
  }
  switch (operator) {
    case '**':
      return left ** right
    case '>>':
      return left >> right
    case '<<':
      return left << right
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return left / right
    case '%':
      return left % right
    case '|':
      return left | right
    case '&':
      return left & right
    case '^':
      return left ^ right
    /* v8 ignore next 2 -- @preserve Unsure if we can reach it. */
    default:
      return null
  }
}

/**
 * Evaluates a unary expression to compute its numeric value.
 *
 * Supports unary plus (+), minus (-), and bitwise NOT (~) operators.
 *
 * @param argumentExpression - The operand of the unary expression.
 * @param operator - The operator string (e.g., '+', '-', '~').
 * @returns The computed numeric value, or null if it cannot be evaluated.
 */
function computeUnaryExpressionNumberValue(
  argumentExpression: TSESTree.Expression,
  operator: string,
): number | null {
  let argument = computeExpressionNumberValue(argumentExpression)
  if (argument === null) {
    return null
  }
  switch (operator) {
    case '+':
      return argument
    case '-':
      return -argument
    case '~':
      return ~argument
    /* v8 ignore next 2 -- @preserve Unsure if we can reach it. */
    default:
      return null
  }
}
