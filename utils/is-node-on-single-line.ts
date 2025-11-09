import type { TSESTree } from '@typescript-eslint/types'

/**
 * Returns if a node is on a single line.
 *
 * @param node - The node to check.
 * @returns True if the node is on a single line, false otherwise.
 */
export function isNodeOnSingleLine(node: TSESTree.Node): boolean {
  return node.loc.start.line === node.loc.end.line
}
