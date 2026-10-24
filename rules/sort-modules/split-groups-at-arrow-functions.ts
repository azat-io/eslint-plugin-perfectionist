import type { SortModulesSortingNode, SortModulesNode } from './types'

type SortModulesSortingNodeWithoutOverloadSignature = Omit<
  SortModulesSortingNode,
  'overloadSignatureImplementation'
>

/**
 * Removes arrow functions from the blocks that also contain a class or an enum,
 * and splits the sorting node groups at them. The nodes that follow a removed
 * arrow function move to a new block.
 *
 * Classes and enums run code while the module is evaluated, and this code may
 * call an arrow function declared before them. Such arrow functions keep their
 * position and split the block, as other variable declarations do.
 *
 * @param params - The parameters object.
 * @param params.sortingNodeGroups - The sorting node groups of the module.
 * @param params.arrowFunctionNodes - Nodes that declare arrow functions.
 * @param params.nonDeclareClassOrEnumNodes - Nodes that declare classes or
 *   enums without `declare`.
 * @returns The sorting node groups, split where needed.
 */
export function splitGroupsAtArrowFunctions({
  nonDeclareClassOrEnumNodes,
  arrowFunctionNodes,
  sortingNodeGroups,
}: {
  sortingNodeGroups: SortModulesSortingNodeWithoutOverloadSignature[][]
  nonDeclareClassOrEnumNodes: ReadonlySet<SortModulesNode>
  arrowFunctionNodes: ReadonlySet<SortModulesNode>
}): SortModulesSortingNodeWithoutOverloadSignature[][] {
  let sortingNodes = sortingNodeGroups.flat()
  let blockIdsWithClassOrEnum = new Set(
    sortingNodes
      .filter(({ node }) => nonDeclareClassOrEnumNodes.has(node))
      .map(({ blockId }) => blockId),
  )
  if (!sortingNodes.some(isArrowFunctionToRemove)) {
    return sortingNodeGroups
  }

  let nextBlockId = Math.max(...sortingNodes.map(({ blockId }) => blockId)) + 1
  let splitBlockIdByBlockId = new Map<number, number>()
  let splitGroups: SortModulesSortingNodeWithoutOverloadSignature[][] = []

  for (let sortingNodeGroup of sortingNodeGroups) {
    splitGroups.push([])

    for (let sortingNode of sortingNodeGroup) {
      if (isArrowFunctionToRemove(sortingNode)) {
        splitBlockIdByBlockId.set(sortingNode.blockId, nextBlockId++)
        splitGroups.push([])
        continue
      }

      splitGroups.at(-1)!.push({
        ...sortingNode,
        blockId:
          splitBlockIdByBlockId.get(sortingNode.blockId) ?? sortingNode.blockId,
      })
    }
  }

  return splitGroups.map((sortingNodeGroup, index) =>
    sortingNodeGroup.map(sortingNode => ({
      ...sortingNode,
      partitionId: index + 1,
    })),
  )

  function isArrowFunctionToRemove({
    blockId,
    node,
  }: SortModulesSortingNodeWithoutOverloadSignature): boolean {
    return arrowFunctionNodes.has(node) && blockIdsWithClassOrEnum.has(blockId)
  }
}
