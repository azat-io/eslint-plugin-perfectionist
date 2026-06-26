import type { TSESLint } from '@typescript-eslint/utils'

import type { SortConstructorParametersSortingNode } from './types'

import { computeDependenciesBySortingNode as baseComputeDependenciesBySortingNode } from '../../utils/compute-dependencies-by-sorting-node'

type SortingNodeWithoutDependencies = Omit<
  SortConstructorParametersSortingNode,
  'dependencies'
>

export function computeDependenciesBySortingNode({
  sortingNodes,
  sourceCode,
}: {
  sortingNodes: SortingNodeWithoutDependencies[]
  sourceCode: TSESLint.SourceCode
}): Map<SortingNodeWithoutDependencies, SortingNodeWithoutDependencies[]> {
  return baseComputeDependenciesBySortingNode({
    sortingNodes,
    sourceCode,
  })
}
