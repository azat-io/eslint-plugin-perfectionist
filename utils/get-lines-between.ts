import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNode } from '../types/sorting-node'

/**
 * Counts the number of empty lines between two AST nodes.
 *
 * Extracts the lines between the end of the left node and the start of the
 * right node, then counts only the completely empty lines (containing only
 * whitespace). This is used to determine if nodes are separated by newlines and
 * to enforce newline formatting rules.
 *
 * @example
 *   // Source code:
 *   // const a = 1;
 *   //
 *   // const b = 2;
 *
 *   getLinesBetween(sourceCode, nodeA, nodeB)
 *   // Returns: 1 (one empty line between nodes)
 *
 * @example
 *   // Source code:
 *   // const a = 1;
 *   // // comment
 *   // const b = 2;
 *
 *   getLinesBetween(sourceCode, nodeA, nodeB)
 *   // Returns: 0 (no empty lines, comment line is not empty)
 *
 * @param source - ESLint source code object containing the lines array.
 * @param left - Node or object containing the left/first node.
 * @param right - Node or object containing the right/second node.
 * @returns Number of empty lines between the two nodes.
 */
export function getLinesBetween(
  source: TSESLint.SourceCode,
  left: Pick<SortingNode, 'node'>,
  right: Pick<SortingNode, 'node'>,
): number {
  let linesBetween = source.lines.slice(
    left.node.loc.end.line,
    right.node.loc.start.line - 1,
  )

  return linesBetween.filter(line => line.trim().length === 0).length
}
