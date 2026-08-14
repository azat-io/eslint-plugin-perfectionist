import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { ShouldIgnoreIdentifierComputer } from './compute-dependencies-by-sorting-node'
import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'
import type { RegexOption } from '../types/common-options'

import { computeDependenciesBySortingNode } from './compute-dependencies-by-sorting-node'
import { isNodeInsideDeferredFunction } from './is-node-inside-deferred-function'

export function computeDependenciesOutsideDeferredFunctionsBySortingNode<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  ignoreCallbackDependenciesPatterns,
  sortingNodes,
  sourceCode,
}: {
  ignoreCallbackDependenciesPatterns: RegexOption
  sourceCode: TSESLint.SourceCode
  sortingNodes: T[]
}): Map<T, T[]> {
  return computeDependenciesBySortingNode({
    shouldIgnoreIdentifierComputer: buildShouldIgnoreIdentifierComputer(),
    sortingNodes,
    sourceCode,
  })

  function buildShouldIgnoreIdentifierComputer(): ShouldIgnoreIdentifierComputer<T> {
    return ({ referencingSortingNode, identifier }) =>
      isNodeInsideDeferredFunction({
        maxParent: referencingSortingNode.node,
        ignoreCallbackDependenciesPatterns,
        node: identifier,
      })
  }
}
