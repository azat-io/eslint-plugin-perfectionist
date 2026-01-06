import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

interface GetCommentsBeforeParameters {
  tokenValueToIgnoreBefore?: string
  sourceCode: TSESLint.SourceCode
  node: TSESTree.Node
}

/**
 * Returns a list of comments before a given node, excluding ones that are right
 * after code. Includes comment blocks, ignore shebang comments.
 *
 * @param params - Parameters object.
 * @param params.node - The node to get comments before.
 * @param params.sourceCode - The source code object.
 * @param [params.tokenValueToIgnoreBefore] - Allows the following token to
 *   directly precede the node.
 * @returns An array of comments before the given node.
 */
export function getCommentsBefore({
  tokenValueToIgnoreBefore,
  sourceCode,
  node,
}: GetCommentsBeforeParameters): TSESTree.Comment[] {
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

function getRelevantCommentsBeforeNodeOrToken(
  source: TSESLint.SourceCode,
  node: TSESTree.Token | TSESTree.Node,
): TSESTree.Comment[] {
  return source
    .getCommentsBefore(node)
    .filter(comment => !isShebangComment(comment))
    .filter(comment => {
      /**
       * `getCommentsBefore` also returns comments that are right after code,
       * filter those out.
       */
      let tokenBeforeComment = source.getTokenBefore(comment)
      return tokenBeforeComment?.loc.end.line !== comment.loc.end.line
    })
}

function isShebangComment(comment: TSESTree.Comment): boolean {
  return (
    comment.type === ('Shebang' as unknown) ||
    comment.type === ('Hashbang' as unknown)
  )
}
