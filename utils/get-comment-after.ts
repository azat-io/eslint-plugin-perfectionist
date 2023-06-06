import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_TOKEN_TYPES } from '@typescript-eslint/types'

export let getCommentAfter = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
): TSESTree.Comment | null => {
  let token = source.getTokenAfter(node, {
    includeComments: true,
    filter: ({ type, value }) =>
      !(type === AST_TOKEN_TYPES.Punctuator && [',', ';'].includes(value)),
  })

  if (
    (token?.type === AST_TOKEN_TYPES.Block ||
      token?.type === AST_TOKEN_TYPES.Line) &&
    node.loc.end.line === token.loc.end.line
  ) {
    return token
  }

  return null
}
