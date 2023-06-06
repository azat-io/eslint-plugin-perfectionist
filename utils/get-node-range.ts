import type { TSESLint } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

import { ASTUtils } from '@typescript-eslint/utils'

import { getComment } from './get-comment'

export let getNodeRange = (
  node: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
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

  let comment = getComment(node, sourceCode)

  if (raw.endsWith(';') || raw.endsWith(',')) {
    end -= 1
  }

  if (comment.before) {
    start = comment.before.range.at(0)!
  }

  if (comment.after) {
    end = comment.after.range.at(1)!
  }

  return [start, end]
}
