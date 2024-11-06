import type { TSESTree } from '@typescript-eslint/types'

export const isNodeEslintDisabled = (
  node: TSESTree.Node,
  eslintDisabledLines: number[],
) => eslintDisabledLines.includes(node.loc.start.line)
