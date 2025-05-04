import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

interface GetCommentsBeforeParameters {
  tokenValueToIgnoreBefore?: string
  sourceCode: TSESLint.SourceCode
  node: TSESTree.Node
}

/**
 * Returns a list of comments before a given node, excluding ones that are
 * right after code. Includes comment blocks, ignore shebang comments.
 * @param {object} params - Parameters object.
 * @param {TSESTree.Node} params.node - The node to get comments before.
 * @param {TSESLint.SourceCode} params.sourceCode - The source code object.
 * @param {string} [params.tokenValueToIgnoreBefore] - Allows the following token to
 * directly precede the node.
 * @returns {TSESTree.Comment[]} An array of comments before the given node.
 */
export let getCommentsBefore = ({
  tokenValueToIgnoreBefore,
  sourceCode,
  node,
}: GetCommentsBeforeParameters): TSESTree.Comment[] => {
  let commentsBefore = getRelevantCommentsBeforeNodeOrToken(sourceCode, node)
  let tokenBeforeNode = sourceCode.getTokenBefore(node)
  if (
    commentsBefore.length > 0 ||
    !tokenValueToIgnoreBefore ||
    tokenBeforeNode?.value !== tokenValueToIgnoreBefore
  ) {
    return commentsBefore
  }
  return getRelevantCommentsBeforeNodeOrToken(sourceCode, tokenBeforeNode)
}

let getRelevantCommentsBeforeNodeOrToken = (
  source: TSESLint.SourceCode,
  node: TSESTree.Token | TSESTree.Node,
): TSESTree.Comment[] =>
  source
    .getCommentsBefore(node)
    .filter(comment => !isShebangComment(comment))
    .filter(comment => {
      /**
       * `getCommentsBefore` also returns comments that are right after code,
       * filter those out
       */
      let tokenBeforeComment = source.getTokenBefore(comment)
      return tokenBeforeComment?.loc.end.line !== comment.loc.end.line
    })

let isShebangComment = (comment: TSESTree.Comment): boolean =>
  comment.type === ('Shebang' as unknown) ||
  comment.type === ('Hashbang' as unknown)
