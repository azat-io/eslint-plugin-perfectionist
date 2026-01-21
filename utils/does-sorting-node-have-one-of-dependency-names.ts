import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

/**
 * Checks whether the given sorting node has at least one of the given
 * dependency names.
 *
 * @param sortingNode - The sorting node to check.
 * @param dependencyNames - The dependency names to look for.
 * @returns True if the sorting node has at least one of the dependency names,
 *   false otherwise.
 */
export function doesSortingNodeHaveOneOfDependencyNames(
  sortingNode: Pick<SortingNodeWithDependencies, 'dependencyNames'>,
  dependencyNames: string[],
): boolean {
  let sortingNodeDependencyNames = new Set(sortingNode.dependencyNames)
  return dependencyNames.some(dependencyName =>
    sortingNodeDependencyNames.has(dependencyName),
  )
}
