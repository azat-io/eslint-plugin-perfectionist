import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Computes the name of an array member.
 *
 * @param props - The parameters object.
 * @param props.sourceCode - ESLint source code object for text extraction.
 * @param props.node - The AST node representing an array member.
 * @returns The name of the array member.
 */
export function computeNodeName({
  sourceCode,
  node,
}: {
  node: TSESTree.SpreadElement | TSESTree.Expression
  sourceCode: TSESLint.SourceCode
}): string {
  return node.type === AST_NODE_TYPES.Literal ?
      `${node.value}`
    : sourceCode.getText(node)
}
