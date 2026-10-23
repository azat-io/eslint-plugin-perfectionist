import type { TSESLint } from '@typescript-eslint/utils'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { SortingNode } from '../../types/sorting-node'

import { getNodeRange } from '../../utils/get-node-range'

/**
 * Splits the sorting node groups of a module into blocks that no other code
 * separates. Comments and empty lines between two groups keep them in the same
 * block, while a statement such as a function call starts a new one.
 *
 * Moving a node across such a statement can change what the statement sees when
 * it runs, so nodes must never leave their block.
 *
 * @param params - The parameters object.
 * @param params.sortingNodeGroups - The sorting node groups, in source order.
 * @param params.sourceCode - The source code object.
 * @param params.options - Options that affect node ranges.
 * @returns The blocks, each holding consecutive sorting node groups.
 */
export function computeSortingNodeBlocks<
  T extends Pick<SortingNode, 'implicitDecorators' | 'node'>,
>({
  sortingNodeGroups,
  sourceCode,
  options,
}: {
  options: Pick<CommonPartitionOptions, 'partitionByComment'>
  sourceCode: TSESLint.SourceCode
  sortingNodeGroups: T[][]
}): T[][][] {
  let blocks: T[][][] = [[]]
  let lastSortingNode: undefined | T
  for (let sortingNodeGroup of sortingNodeGroups) {
    let [firstSortingNode] = sortingNodeGroup
    if (
      firstSortingNode &&
      lastSortingNode &&
      isCodeBetween(lastSortingNode, firstSortingNode)
    ) {
      blocks.push([])
    }
    blocks.at(-1)!.push(sortingNodeGroup)
    lastSortingNode = sortingNodeGroup.at(-1) ?? lastSortingNode
  }
  return blocks

  function isCodeBetween(left: T, right: T): boolean {
    let [rightStart] = getNodeRange({
      implicitDecorators: right.implicitDecorators,
      node: right.node,
      sourceCode,
      options,
    })
    return sourceCode.getTokenAfter(left.node)!.range[0] < rightStart
  }
}
