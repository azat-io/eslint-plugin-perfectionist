import type { TSESLint } from '@typescript-eslint/utils'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { SortModulesSortingNode } from './types'

import { computeSortingNodeBlocks } from './compute-sorting-node-blocks'

type PartialSortModulesSortingNode = Pick<
  SortModulesSortingNode,
  'implicitDecorators' | 'dependencyNames' | 'dependencies' | 'node'
>

/**
 * Drops the dependencies between sorting nodes of different blocks.
 *
 * A dependency across a block boundary can't be fixed by moving nodes, as the
 * code between the blocks must keep running before or after the same nodes.
 * Dropping it keeps the dependency sort and its errors inside each block.
 *
 * @param params - The parameters object.
 * @param params.sortingNodeGroups - The sorting node groups of the module.
 * @param params.sourceCode - The source code object.
 * @param params.options - Options that affect node ranges.
 * @returns The sorting node groups with dependencies limited to their block.
 */
export function limitDependenciesToBlocks<
  T extends PartialSortModulesSortingNode,
>({
  sortingNodeGroups,
  sourceCode,
  options,
}: {
  options: Pick<CommonPartitionOptions, 'partitionByComment'>
  sourceCode: TSESLint.SourceCode
  sortingNodeGroups: T[][]
}): T[][] {
  let blocks = computeSortingNodeBlocks({
    sortingNodeGroups,
    sourceCode,
    options,
  })
  if (blocks.length === 1) {
    return sortingNodeGroups
  }

  return blocks.flatMap(block => {
    let blockDependencyNames = new Set(
      block.flat().flatMap(({ dependencyNames }) => dependencyNames),
    )
    return block.map(sortingNodeGroup =>
      sortingNodeGroup.map(sortingNode => ({
        ...sortingNode,
        dependencies: sortingNode.dependencies.filter(dependency =>
          blockDependencyNames.has(dependency),
        ),
      })),
    )
  })
}
