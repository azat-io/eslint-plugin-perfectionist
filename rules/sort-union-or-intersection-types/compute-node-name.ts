import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Computes the name of a union/intersection member.
 *
 * Multi-line parenthesized unions/intersections can include leading `|` or `&`
 * in raw source text, while formatter output often omits them. To keep sorting
 * stable across both forms, the leading separator prefix is normalized.
 *
 * @param params - Parameters object.
 * @param params.sourceCode - ESLint source code object for text extraction.
 * @param params.type - Type node represented by the member text.
 * @returns Normalized member text used for sorting and matching.
 */
export function computeNodeName({
  sourceCode,
  type,
}: {
  sourceCode: TSESLint.SourceCode
  type: TSESTree.TypeNode
}): string {
  let name = sourceCode.getText(type)

  if (
    type.type !== AST_NODE_TYPES.TSUnionType &&
    type.type !== AST_NODE_TYPES.TSIntersectionType
  ) {
    return name
  }

  return name.replace(/^\s*[&|]\s*/u, '')
}
