import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_TOKEN_TYPES } from '@typescript-eslint/types'

export let getCommentBefore = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
): TSESTree.Comment | null => {
  let [tokenBefore, tokenOrCommentBefore] = source.getTokensBefore(node, {
    filter: ({ type, value }) =>
      !(type === AST_TOKEN_TYPES.Punctuator && [',', ';'].includes(value)),
    includeComments: true,
    count: 2,
  }) as (TSESTree.Token | null)[]

  if (
    (tokenOrCommentBefore?.type === AST_TOKEN_TYPES.Block ||
      tokenOrCommentBefore?.type === AST_TOKEN_TYPES.Line) &&
    node.loc.start.line - tokenOrCommentBefore.loc.end.line <= 1 &&
    tokenBefore?.loc.end.line !== tokenOrCommentBefore.loc.start.line
  ) {
    return tokenOrCommentBefore
  }

  return null
}
