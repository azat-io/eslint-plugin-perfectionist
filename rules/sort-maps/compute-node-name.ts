import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Extracts the name of a Map element for sorting purposes.
 *
 * For array expressions (key-value pairs), extracts the first element as the
 * key. Returns the literal raw value for literals, or the source code text for
 * other expressions.
 *
 * @param params - Parameters object.
 * @param params.sourceCode - The ESLint source code object.
 * @param params.node - The Map element expression to get the name from.
 * @returns The name to use for sorting this Map element.
 */
export function computeNodeName({
  sourceCode,
  node,
}: {
  sourceCode: TSESLint.SourceCode
  node: TSESTree.Expression
}): string {
  if (node.type !== AST_NODE_TYPES.ArrayExpression) {
    return sourceCode.getText(node)
  }

  let [left] = node.elements

  if (!left) {
    return 'undefined'
  }

  return left.type === AST_NODE_TYPES.Literal ?
      left.raw
    : sourceCode.getText(left)
}
