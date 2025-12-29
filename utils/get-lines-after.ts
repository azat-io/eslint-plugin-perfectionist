import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

/**
 * Extracts the lines immediately after the entered node.
 *
 * @param sourceCode - ESLint source code.
 * @param sortingNode - Object containing the node.
 * @returns Number of empty lines right after the node.
 */
export function getLinesAfter(
  sourceCode: TSESLint.SourceCode,
  sortingNode: Pick<SortingNode, 'node'>,
): number {
  let count = 0

  for (
    let i = sortingNode.node.loc.end.line;
    i < sourceCode.lines.length;
    i++
  ) {
    if (sourceCode.lines[i]!.trim().length > 0) {
      return count
    }
    count++
  }

  return count
}
