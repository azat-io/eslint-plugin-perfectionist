import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

export let isNodeDependentOnOtherNode = (
  sortingNode1: SortingNodeWithDependencies,
  sortingNode2: SortingNodeWithDependencies,
): boolean => {
  if (sortingNode1 === sortingNode2) {
    return false
  }
  return sortingNode1.dependencyNames.some(dependency =>
    sortingNode2.dependencies.includes(dependency),
  )
}
