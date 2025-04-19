import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

export let isNodeDependentOnOtherNode = (
  sortingNode1: SortingNodeWithDependencies,
  sortingNode2: SortingNodeWithDependencies,
): boolean =>
  sortingNode1 !== sortingNode2 &&
  sortingNode2.dependencies.includes(
    sortingNode1.dependencyName ?? sortingNode1.name,
  )
