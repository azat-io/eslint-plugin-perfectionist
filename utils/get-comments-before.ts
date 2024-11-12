import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

/**
 * Returns a list of comments before a given node, excluding ones that are
 * right after code. Includes comment blocks.
 * @param node The node to get comments before
 * @param source The source code
 * @param tokenValueToIgnoreBefore Allows the following token to directly precede the node
 */
export let getCommentsBefore = (
  node: TSESTree.Node,
  source: TSESLint.SourceCode,
  tokenValueToIgnoreBefore?: string,
): TSESTree.Comment[] => {
  let commentsBefore = getCommentsBeforeNodeOrToken(source, node)
  let tokenBeforeNode = source.getTokenBefore(node)
  if (
    commentsBefore.length ||
    !tokenValueToIgnoreBefore ||
    tokenBeforeNode?.value !== tokenValueToIgnoreBefore
  ) {
    return commentsBefore
  }
  return getCommentsBeforeNodeOrToken(source, tokenBeforeNode)
}

let getCommentsBeforeNodeOrToken = (
  source: TSESLint.SourceCode,
  node: TSESTree.Token | TSESTree.Node,
): TSESTree.Comment[] =>
  source.getCommentsBefore(node).filter(comment => {
    // 'getCommentsBefore' also returns comments that are right after code, filter those out
    let tokenBeforeComment = source.getTokenBefore(comment)
    return tokenBeforeComment?.loc.end.line !== comment.loc.end.line
  })
