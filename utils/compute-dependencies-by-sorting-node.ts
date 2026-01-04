import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

import { computeDeepScopeReferences } from './compute-deep-scope-references'
import { rangeContainsRange } from './range-contains-range'

export type ShouldIgnoreIdentifierComputer<T> = (parameters: {
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier
  referencingSortingNode: T
}) => boolean
export type AdditionalIdentifierDependenciesComputer<T> = (parameters: {
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier
}) => T[]

export function computeDependenciesBySortingNode<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  additionalIdentifierDependenciesComputer,
  shouldIgnoreIdentifierComputer,
  sortingNodes,
  sourceCode,
}: {
  additionalIdentifierDependenciesComputer?: AdditionalIdentifierDependenciesComputer<T>
  shouldIgnoreIdentifierComputer?: ShouldIgnoreIdentifierComputer<T>
  sourceCode: TSESLint.SourceCode
  sortingNodes: T[]
}): Map<T, T[]> {
  let returnValue = new Map<T, T[]>()

  let references = sortingNodes.flatMap(sortingNode =>
    computeDeepScopeReferences(sortingNode.node, sourceCode),
  )

  for (let reference of new Set(references)) {
    let { identifier, resolved } = reference
    if (!resolved) {
      continue
    }

    let referencingSortingNode = findSortingNodeContainingIdentifier(
      sortingNodes,
      identifier,
    )
    if (!referencingSortingNode) {
      continue
    }

    let referencedNodes = returnValue.get(referencingSortingNode) ?? []
    returnValue.set(referencingSortingNode, referencedNodes)

    referencedNodes.push(
      ...computeMainIdentifierDependencies({
        shouldIgnoreIdentifierComputer,
        referencingSortingNode,
        sortingNodes,
        identifier,
        resolved,
      }),
      ...(additionalIdentifierDependenciesComputer?.({
        identifier,
      }) ?? []),
    )
  }

  return returnValue
}

function computeMainIdentifierDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'node'>,
>({
  shouldIgnoreIdentifierComputer,
  referencingSortingNode,
  sortingNodes,
  identifier,
  resolved,
}: {
  shouldIgnoreIdentifierComputer: ShouldIgnoreIdentifierComputer<T> | undefined
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier
  resolved: TSESLint.Scope.Variable
  referencingSortingNode: T
  sortingNodes: T[]
}): T[] {
  if (
    shouldIgnoreIdentifierComputer?.({
      referencingSortingNode,
      identifier,
    })
  ) {
    return []
  }

  let [firstIdentifier] = resolved.identifiers
  if (!firstIdentifier) {
    return []
  }

  let referencedSortingNode = findSortingNodeContainingIdentifier(
    sortingNodes,
    firstIdentifier,
  )
  if (!referencedSortingNode) {
    return []
  }

  if (referencedSortingNode === referencingSortingNode) {
    return []
  }

  return [referencedSortingNode]
}

function findSortingNodeContainingIdentifier<T extends { node: TSESTree.Node }>(
  sortingNodes: T[],
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier,
): undefined | T {
  return sortingNodes.find(sortingNode =>
    rangeContainsRange(sortingNode.node.range, identifier.range),
  )
}
