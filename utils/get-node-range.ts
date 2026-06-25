import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { ASTUtils } from '@typescript-eslint/utils'

import type { CommonPartitionOptions } from '../types/common-partition-options'

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
  /**
   * Optional configuration for comment handling.
   */
  options?: Pick<CommonPartitionOptions, 'partitionByComment'>

  /**
   * Decorators associated with this node that are not directly accessible via
   * the AST node's own `decorators` property.
   *
   * Used in contexts where decorators are tracked separately from their
   * decorated node. When provided, these decorators override the node's own
   * `decorators` in range calculations, ensuring they are included when the
   * node is moved during sorting fixes.
   */
  implicitDecorators?: TSESTree.Decorator[]

  /**
   * Whether to exclude the highest-level block comment from the range. Useful
   * for preserving file-level documentation comments in their original
   * position.
   */
  ignoreHighestBlockComment?: boolean

  /**
   * ESLint source code object for accessing comments and tokens.
   */
  sourceCode: TSESLint.SourceCode

  /**
   * AST node to get the range for.
   */
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
 *
 * ```ts
 * // Source code:
 * // This comment belongs to the function
 * // So does this one
 * function foo() {}
 *
 * const range = getNodeRange({ node: functionNode, sourceCode })
 * // Returns range including both comments
 * ```
 *
 * @example
 *
 * ```ts
 * // Source code:
 * /* File header comment *\/
 * // Function comment
 * function bar() { }
 *
 * const range = getNodeRange({
 * node: functionNode,
 * sourceCode,
 * ignoreHighestBlockComment: true
 * });
 * // Returns range including line comment but not block comment
 * ```
 *
 * @param params - Parameters for range calculation.
 * @returns Tuple of [start, end] positions including relevant comments.
 */
export function getNodeRange({
  ignoreHighestBlockComment,
  implicitDecorators,
  sourceCode,
  options,
  node,
}: GetNodeRangeParameters): TSESTree.Range {
  let start = node.range.at(0)!
  let end = node.range.at(1)!

  let decorators =
    implicitDecorators ?? ('decorators' in node ? node.decorators : [])
  if (decorators[0]) {
    start = Math.min(start, decorators[0].range[0])
  }

  if (ASTUtils.isParenthesized(node, sourceCode)) {
    let bodyOpeningParen = sourceCode.getTokenBefore(
      node,
      ASTUtils.isOpeningParenToken,
    )!

    let bodyClosingParen = sourceCode.getTokenAfter(
      node,
      ASTUtils.isClosingParenToken,
    )!

    start = Math.min(start, bodyOpeningParen.range.at(0)!)
    end = bodyClosingParen.range.at(1)!
  }

  let topCommentStart = computeHighestCommentStart({
    comments: getCommentsBefore({ sourceCode, node }),
    anchorLine: node.loc.start.line,
    ignoreHighestBlockComment,
    options,
  })
  if (topCommentStart !== undefined) {
    start = Math.min(start, topCommentStart)
  }

  return [start, end]
}

function computeHighestCommentStart({
  ignoreHighestBlockComment,
  anchorLine,
  comments,
  options,
}: Pick<GetNodeRangeParameters, 'ignoreHighestBlockComment' | 'options'> & {
  comments: TSESTree.Comment[]
  anchorLine: number
}): undefined | number {
  let highestBlockComment = comments.find(comment => comment.type === 'Block')
  let highestCommentStart: undefined | number
  for (let i = comments.length - 1; i >= 0; i--) {
    let comment = comments[i]!
    if (ignoreHighestBlockComment && comment === highestBlockComment) {
      break
    }

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
    let previousCommentOrAnchorLine =
      i === comments.length - 1 ? anchorLine : comments[i + 1]!.loc.start.line
    if (comment.loc.end.line !== previousCommentOrAnchorLine - 1) {
      break
    }

    highestCommentStart = comment.range.at(0)
  }
  return highestCommentStart
}
