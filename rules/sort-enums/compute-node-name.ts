import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Computes the name of an enum member node.
 *
 * @param params - Parameters for group-based sorting.
 * @param params.node - The enum member node.
 * @param params.sourceCode - The source code object.
 * @returns The computed name of the enum member node.
 */
export function computeNodeName({
  sourceCode,
  node,
}: {
  sourceCode: TSESLint.SourceCode
  node: TSESTree.TSEnumMember
}): string {
  return node.id.type === AST_NODE_TYPES.Literal ?
      node.id.value
    : sourceCode.getText(node.id)
}
