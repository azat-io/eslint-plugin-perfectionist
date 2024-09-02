import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { ASTUtils } from '@typescript-eslint/utils'

import { isPartitionComment } from './is-partition-comment'
import { getCommentsBefore } from './get-comments-before'

export let getNodeRange = (
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
  additionalOptions?: {
    partitionComment?: string[] | boolean | string
  },
): TSESTree.Range => {
  let start = node.range.at(0)!
  let end = node.range.at(1)!

  let raw = sourceCode.text.slice(start, end)

  if (ASTUtils.isParenthesized(node, sourceCode)) {
    let bodyOpeningParen = sourceCode.getTokenBefore(
      node,
      ASTUtils.isOpeningParenToken,
    )!

    let bodyClosingParen = sourceCode.getTokenAfter(
      node,
      ASTUtils.isClosingParenToken,
    )!

    start = bodyOpeningParen.range.at(0)!
    end = bodyClosingParen.range.at(1)!
  }

  if (raw.endsWith(';') || raw.endsWith(',')) {
    let tokensAfter = sourceCode.getTokensAfter(node, {
      includeComments: true,
      count: 2,
    })

    if (node.loc.start.line === tokensAfter.at(1)?.loc.start.line) {
      end -= 1
    }
  }
  let comments = getCommentsBefore(node, sourceCode)
  let commentAtTheTop = comments.at(0)

  // Ignore comment at the top if it's a partition comment
  let isCommentAtTheTopPartitionComment =
    commentAtTheTop &&
    isPartitionComment(
      additionalOptions?.partitionComment ?? false,
      commentAtTheTop.value,
    )

  if (isCommentAtTheTopPartitionComment) {
    let commentBelowTop = comments.at(-2)
    if (commentBelowTop) {
      start = commentBelowTop.range.at(0)!
    }
  } else if (commentAtTheTop) {
    start = commentAtTheTop.range.at(0)!
  }

  return [start, end]
}
