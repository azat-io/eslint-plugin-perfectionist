import type { TSESTree } from '@typescript-eslint/types'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

type WithDependencies<T> = {
  dependencies: string[]
} & T

/**
 * Populate sorting node groups based on the dependencies matrix.
 *
 * @param params - The parameters object.
 * @param params.dependenciesBySortingNode - A map of sorting nodes to their
 *   dependencies.
 * @param params.sortingNodeGroups - An array of sorting node groups.
 * @returns An array of sorting node groups with their dependencies.
 */
export function populateSortingNodeGroupsWithDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  dependenciesBySortingNode,
  sortingNodeGroups,
}: {
  dependenciesBySortingNode: Map<T, T[]>
  sortingNodeGroups: T[][]
}): WithDependencies<T>[][] {
  return sortingNodeGroups.map(sortingNodes =>
    computeSortingNodeGroupWithDependencies({
      dependenciesBySortingNode,
      sortingNodes,
    }),
  )
}

function computeSortingNodeGroupWithDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  dependenciesBySortingNode,
  sortingNodes,
}: {
  dependenciesBySortingNode: Map<T, T[]>
  sortingNodes: T[]
}): WithDependencies<T>[] {
  return sortingNodes.map(computeSortingNodeWithDependencies)

  function computeSortingNodeWithDependencies(
    sortingNode: T,
  ): WithDependencies<T> {
    return {
      ...sortingNode,
      dependencies: computeSortingNodeDependencies({
        dependenciesBySortingNode,
        sortingNode,
      }),
    }
  }
}

function computeSortingNodeDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  dependenciesBySortingNode,
  sortingNode,
}: {
  dependenciesBySortingNode: Map<T, T[]>
  sortingNode: T
}): string[] {
  let dependencies = dependenciesBySortingNode.get(sortingNode)
  if (!dependencies) {
    return []
  }

  return dependencies.flatMap(({ dependencyNames }) => dependencyNames)
}
