import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { getLinesAfter } from './get-lines-after'

/**
 * Parameters for checking newlines after nodes and generating errors.
 *
 * @template MessageIds - Type of error message identifiers.
 * @template T - Type of the sorting node.
 */
interface GetNewlinesBetweenErrorsParameters<
  MessageIds extends string,
  T extends SortingNode,
> {
  /**
   * Configuration options for newlines.
   */
  options: { newlinesAfter: 'ignore' | number }

  /**
   * ESLint source code object for accessing lines.
   */
  sourceCode: TSESLint.SourceCode

  /**
   * Error message ID for missing required newlines.
   */
  missedSpacingError: MessageIds

  /**
   * Error message ID for extra unwanted newlines.
   */
  extraSpacingError: MessageIds

  /**
   * Sorting node in the comparison.
   */
  sortingNode: T
}

export function getNewlinesAfterErrors<
  MessageIds extends string,
  T extends SortingNode,
>({
  missedSpacingError,
  extraSpacingError,
  sortingNode,
  sourceCode,
  options,
}: GetNewlinesBetweenErrorsParameters<MessageIds, T>): MessageIds[] {
  if (options.newlinesAfter === 'ignore') {
    return []
  }

  let hasSomethingAfter = !!sourceCode.getTokenAfter(sortingNode.node)
  if (!hasSomethingAfter) {
    return []
  }

  let numberOfEmptyLinesAfter = getLinesAfter(sourceCode, sortingNode)
  if (numberOfEmptyLinesAfter < options.newlinesAfter) {
    return [missedSpacingError]
  }
  if (numberOfEmptyLinesAfter > options.newlinesAfter) {
    return [extraSpacingError]
  }
  return []
}
