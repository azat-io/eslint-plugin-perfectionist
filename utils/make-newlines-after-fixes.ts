import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

import { makeNewlinesFix } from './make-newlines-fix'
import { getLinesAfter } from './get-lines-after'

/**
 * Parameters for generating newlines-after fixes.
 */
interface MakeNewlinesAfterFixesParameters {
  /**
   * Configuration options for groups and newlines.
   */
  options: { newlinesAfter: 'ignore' | number }

  /**
   * Last sorted sorting node.
   */
  lastSortedSortingNode: SortingNode

  /**
   * ESLint source code object for accessing text and locations.
   */
  sourceCode: TSESLint.SourceCode

  /**
   * ESLint fixer object for creating fix operations.
   */
  fixer: TSESLint.RuleFixer
}

export function makeNewlinesAfterFixes({
  lastSortedSortingNode,
  sourceCode,
  options,
  fixer,
}: MakeNewlinesAfterFixesParameters): TSESLint.RuleFix[] {
  if (options.newlinesAfter === 'ignore') {
    return []
  }

  let linesAfterLastSortedNode = getLinesAfter(
    sourceCode,
    lastSortedSortingNode,
  )
  if (linesAfterLastSortedNode === options.newlinesAfter) {
    return []
  }

  let nextToken = sourceCode.getTokenAfter(lastSortedSortingNode.node)
  if (!nextToken) {
    return []
  }
  let nextTokenRangeStart = nextToken.range.at(0)!

  let fix = makeNewlinesFix({
    nextNodeRangeStart: nextTokenRangeStart,
    newlinesOption: options.newlinesAfter,
    node: lastSortedSortingNode.node,
    nextNode: nextToken,
    sourceCode,
    fixer,
  })
  return [fix]
}
