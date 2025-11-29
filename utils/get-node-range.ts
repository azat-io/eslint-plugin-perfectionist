import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { ASTUtils } from '@typescript-eslint/utils'

import type { PartitionByCommentOption } from '../types/common-partition-options'

import { getEslintDisabledRules } from './get-eslint-disabled-rules'
import { isPartitionComment } from './is-partition-comment'
import { getCommentsBefore } from './get-comments-before'

/**
 * Parameters for determining the complete range of a node.
 *
 * Configures how to calculate the node's range including associated comments
 * and parentheses.
 */
interface GetNodeRangeParameters {
  /** Optional configuration for comment handling. */
  options?: {
    /**
     * Configuration for partition comments that separate code sections. If
     * specified, partition comments stop the inclusion of preceding comments.
     */
    partitionByComment?: PartitionByCommentOption
  }

  /**
   * Whether to exclude the highest-level block comment from the range. Useful
   * for preserving file-level documentation comments in their original
   * position.
   */

  ignoreHighestBlockComment?: boolean
  /** ESLint source code object for accessing comments and tokens. */

  sourceCode: TSESLint.SourceCode
  /** AST node to get the range for. */
  node: TSESTree.Node
}

/**
 * Determines the complete range of a node including its associated comments.
 *
 * Calculates the full range that should be considered when moving or analyzing
 * a node. This includes:
 *
 * - The node itself
 * - Parentheses surrounding the node (if any)
 * - Preceding comments that "belong" to the node.
 *
 * The function intelligently determines which comments should be included by:
 *
 * - Including comments directly above the node (no empty lines between)
 * - Stopping at partition comments (used to separate sections)
 * - Stopping at ESLint disable/enable comments
 * - Optionally excluding the highest block comment (e.g., file headers).
 *
 * @example
 *   // Source code:
 *   // This comment belongs to the function
 *   // So does this one
 *   function foo() {}
 *
 *   const range = getNodeRange({ node: functionNode, sourceCode })
 *   // Returns range including both comments
 *
 * @example
 *   // Source code:
 *   /* File header comment *\/
 *   // Function comment
 *   function bar() { }
 *
 *   const range = getNodeRange({
 *   node: functionNode,
 *   sourceCode,
 *   ignoreHighestBlockComment: true
 *   });
 *   // Returns range including line comment but not block comment
 *
 * @param params - Parameters for range calculation.
 * @returns Tuple of [start, end] positions including relevant comments.
 */
export function getNodeRange({
  ignoreHighestBlockComment,
  sourceCode,
  options,
  node,
}: GetNodeRangeParameters): TSESTree.Range {
  let start = node.range.at(0)!
  let end = node.range.at(1)!

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

  let comments = getCommentsBefore({
    sourceCode,
    node,
  })
  let highestBlockComment = comments.find(comment => comment.type === 'Block')

  /**
   * Iterate on all comments starting from the bottom until we reach the last of
   * the comments, a newline between comments, a partition comment, or a
   * eslint-disable comment.
   */
  let relevantTopComment: TSESTree.Comment | undefined
  for (let i = comments.length - 1; i >= 0; i--) {
    let comment = comments[i]!

    let eslintDisabledRules = getEslintDisabledRules(comment.value)
    if (
      isPartitionComment({
        partitionByComment: options?.partitionByComment ?? false,
        comment,
      }) ||
      eslintDisabledRules?.eslintDisableDirective === 'eslint-disable' ||
      eslintDisabledRules?.eslintDisableDirective === 'eslint-enable'
    ) {
      break
    }

    /**
     * Check for newlines between comments or between the first comment and the
     * node.
     */
    let previousCommentOrNodeStartLine =
      i === comments.length - 1
        ? node.loc.start.line
        : comments[i + 1]!.loc.start.line
    if (comment.loc.end.line !== previousCommentOrNodeStartLine - 1) {
      break
    }

    if (ignoreHighestBlockComment && comment === highestBlockComment) {
      break
    }

    relevantTopComment = comment
  }

  if (relevantTopComment) {
    start = relevantTopComment.range.at(0)!
  }

  return [start, end]
}
