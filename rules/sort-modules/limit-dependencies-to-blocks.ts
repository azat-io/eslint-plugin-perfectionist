import type { SortModulesSortingNode } from './types'

/**
 * Drops the dependencies between sorting nodes of different blocks.
 *
 * A dependency across a block boundary can't be fixed by moving nodes, as the
 * code between the blocks must keep running before or after the same nodes.
 * Dropping it keeps the dependency sort and its errors inside each block.
 *
 * @param sortingNodeGroups - The sorting node groups of the module.
 * @returns The sorting node groups with dependencies limited to their block.
 */
export function limitDependenciesToBlocks(
  sortingNodeGroups: SortModulesSortingNode[][],
): SortModulesSortingNode[][] {
  let dependencyNamesByBlockId = new Map<number, Set<string>>()
  for (let { dependencyNames, blockId } of sortingNodeGroups.flat()) {
    let blockDependencyNames =
      dependencyNamesByBlockId.get(blockId) ?? new Set<string>()
    for (let dependencyName of dependencyNames) {
      blockDependencyNames.add(dependencyName)
    }
    dependencyNamesByBlockId.set(blockId, blockDependencyNames)
  }

  return sortingNodeGroups.map(sortingNodeGroup =>
    sortingNodeGroup.map(sortingNode => ({
      ...sortingNode,
      dependencies: sortingNode.dependencies.filter(dependency =>
        dependencyNamesByBlockId.get(sortingNode.blockId)!.has(dependency),
      ),
    })),
  )
}
