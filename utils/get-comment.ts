import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { AST_TOKEN_TYPES } from '@typescript-eslint/types'

export let getComment = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
): {
  before: TSESTree.Token | null
  after: TSESTree.Token | null
} => {
  let isComment = (token: TSESTree.Token | null) =>
    token?.type === AST_TOKEN_TYPES.Block ||
    token?.type === AST_TOKEN_TYPES.Line

  let filter = ({ type, value }: TSESTree.Token) =>
    !(type === AST_TOKEN_TYPES.Punctuator && [',', ';'].includes(value))

  let [tokenBefore, tokenOrCommentBefore] = source.getTokensBefore(node, {
    includeComments: true,
    count: 2,
    filter,
  })

  let tokenOrCommentAfter = source.getTokenAfter(node, {
    includeComments: true,
    filter,
  })

  let before = null
  let after = null

  if (
    isComment(tokenOrCommentBefore) &&
    node.loc.start.line - tokenOrCommentBefore.loc.end.line <= 1 &&
    tokenBefore.loc.end.line !== tokenOrCommentBefore.loc.start.line
  ) {
    before = tokenOrCommentBefore
  }

  if (
    isComment(tokenOrCommentAfter) &&
    node.loc.end.line === tokenOrCommentAfter!.loc.end.line
  ) {
    after = tokenOrCommentAfter
  }

  return {
    before,
    after,
  }
}
