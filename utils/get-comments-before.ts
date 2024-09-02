import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

export let getCommentsBefore = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
): TSESTree.Comment[] =>
  source.getCommentsBefore(node).filter(comment => {
    // 'getCommentsBefore' also returns comments that are right after code, filter those out
    let tokenBeforeComment = source.getTokenBefore(comment)
    return tokenBeforeComment?.loc.end.line !== comment.loc.end.line
  })
