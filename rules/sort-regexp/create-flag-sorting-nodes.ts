import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNode } from '../../types/sorting-node'

import { isNodeEslintDisabled } from '../../utils/is-node-eslint-disabled'

/**
 * Builds sorting nodes for every flag attached to a regular expression literal.
 *
 * @param parameters - Literal context alongside enabled flags.
 * @returns Sorting nodes representing each flag.
 */
export function createFlagSortingNodes({
  eslintDisabledLines,
  literalNode,
  flags,
}: {
  eslintDisabledLines: number[]
  literalNode: TSESTree.Literal
  flags: string
}): SortingNode<TSESTree.Literal>[] {
  let isDisabled = isNodeEslintDisabled(literalNode, eslintDisabledLines)

  return [...flags].map(flag => ({
    isEslintDisabled: isDisabled,
    node: literalNode,
    partitionId: 0,
    group: 'flags',
    name: flag,
    size: 1,
  }))
}
