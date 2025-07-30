import type { TSESTree } from '@typescript-eslint/types'

export function isNodeEslintDisabled(
  node: TSESTree.Node,
  eslintDisabledLines: number[],
): boolean {
  return eslintDisabledLines.includes(node.loc.start.line)
}
