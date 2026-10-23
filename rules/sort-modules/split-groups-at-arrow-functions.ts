import type { TSESLint } from '@typescript-eslint/utils'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { SortModulesSortingNode, SortModulesNode } from './types'

import { computeSortingNodeBlocks } from './compute-sorting-node-blocks'

type PartialSortModulesSortingNode = Pick<
  SortModulesSortingNode,
  'implicitDecorators' | 'partitionId' | 'node'
>

/**
 * Removes arrow functions from the blocks that also contain a class or an enum,
 * and splits the sorting node groups of these blocks at them.
 *
 * Classes and enums run code while the module is evaluated, and this code may
 * call an arrow function declared before them. Such arrow functions keep their
 * position and split the block, as other variable declarations do.
 *
 * @param params - The parameters object.
 * @param params.sortingNodeGroups - The sorting node groups of the module.
 * @param params.arrowFunctionNodes - Nodes that declare arrow functions.
 * @param params.classOrEnumNodes - Nodes that declare classes or enums that run
 *   code.
 * @param params.sourceCode - The source code object.
 * @param params.options - Options that affect node ranges.
 * @returns The sorting node groups, split where needed.
 */
export function splitGroupsAtArrowFunctions<
  T extends PartialSortModulesSortingNode,
>({
  arrowFunctionNodes,
  sortingNodeGroups,
  classOrEnumNodes,
  sourceCode,
  options,
}: {
  options: Pick<CommonPartitionOptions, 'partitionByComment'>
  arrowFunctionNodes: ReadonlySet<SortModulesNode>
  classOrEnumNodes: ReadonlySet<SortModulesNode>
  sourceCode: TSESLint.SourceCode
  sortingNodeGroups: T[][]
}): T[][] {
  let blocks = computeSortingNodeBlocks({
    sortingNodeGroups,
    sourceCode,
    options,
  })
  if (!blocks.some(shouldSplitBlock)) {
    return sortingNodeGroups
  }

  let splitGroups: T[][] = []
  for (let block of blocks) {
    if (!shouldSplitBlock(block)) {
      splitGroups.push(...block)
      continue
    }
    for (let sortingNodeGroup of block) {
      splitGroups.push([])
      for (let sortingNode of sortingNodeGroup) {
        if (arrowFunctionNodes.has(sortingNode.node)) {
          splitGroups.push([])
        } else {
          splitGroups.at(-1)!.push(sortingNode)
        }
      }
    }
  }

  return splitGroups.map((sortingNodeGroup, index) =>
    sortingNodeGroup.map(sortingNode => ({
      ...sortingNode,
      partitionId: index + 1,
    })),
  )

  function shouldSplitBlock(block: T[][]): boolean {
    let sortingNodes = block.flat()
    return (
      sortingNodes.some(({ node }) => classOrEnumNodes.has(node)) &&
      sortingNodes.some(({ node }) => arrowFunctionNodes.has(node))
    )
  }
}
