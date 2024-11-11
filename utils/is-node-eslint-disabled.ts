import type { TSESTree } from '@typescript-eslint/types'

export let isNodeEslintDisabled = (
  node: TSESTree.Node,
  eslintDisabledLines: number[],
): boolean => eslintDisabledLines.includes(node.loc.start.line)
