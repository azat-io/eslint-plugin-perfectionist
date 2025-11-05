import type { TSESTree } from '@typescript-eslint/types'

export function isNodeOnSingleLine(node: TSESTree.Node): boolean {
  return node.loc.start.line === node.loc.end.line
}
