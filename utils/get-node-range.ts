import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { ASTUtils } from '@typescript-eslint/utils'

import type { PartitionComment } from '../typings'

import { isPartitionComment } from './is-partition-comment'
import { getCommentBefore } from './get-comment-before'

interface ESLintNode {
  range: TSESTree.Node['range']
  loc: TSESTree.Node['loc']
  type: string
}

export let getNodeRange = (
  node: ESLintNode,
  sourceCode: TSESLint.SourceCode,
  additionalOptions?: {
    partitionComment?: PartitionComment
  },
): TSESTree.Range => {
  let start = node.range.at(0)!
  let end = node.range.at(1)!

  let raw = sourceCode.text.slice(start, end)
  let nodeValue = node as TSESTree.Node

  if (ASTUtils.isParenthesized(nodeValue, sourceCode)) {
    let bodyOpeningParen = sourceCode.getTokenBefore(
      nodeValue,
      ASTUtils.isOpeningParenToken,
    )!

    let bodyClosingParen = sourceCode.getTokenAfter(
      nodeValue,
      ASTUtils.isClosingParenToken,
    )!

    start = bodyOpeningParen.range.at(0)!
    end = bodyClosingParen.range.at(1)!
  }

  let comment = getCommentBefore(nodeValue, sourceCode)

  if (raw.endsWith(';') || raw.endsWith(',')) {
    let tokensAfter = sourceCode.getTokensAfter(nodeValue, {
      includeComments: true,
      count: 2,
    })

    if (node.loc.start.line === tokensAfter.at(1)?.loc.start.line) {
      end -= 1
    }
  }

  if (
    comment &&
    !isPartitionComment(
      additionalOptions?.partitionComment ?? false,
      comment.value,
    )
  ) {
    start = comment.range.at(0)!
  }

  return [start, end]
}
