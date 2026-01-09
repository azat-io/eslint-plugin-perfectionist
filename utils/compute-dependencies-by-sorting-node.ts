import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import type { SortingNodeWithDependencies } from './sort-nodes-by-dependencies'

import { computeDeepScopeReferences } from './compute-deep-scope-references'
import { rangeContainsRange } from './range-contains-range'

/**
 * Compute the list of dependencies for each sorting node.
 *
 * @param params - The parameters object.
 * @param params.sortingNodes - The sorting nodes to compute dependencies for.
 * @param params.sourceCode - The source code object.
 * @returns A map of sorting nodes to their dependencies.
 */
export function computeDependenciesBySortingNode<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'dependencyNames' | 'node'>,
>({
  sortingNodes,
  sourceCode,
}: {
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
        referencingSortingNode,
        sortingNodes,
        resolved,
      }),
    )
  }

  return returnValue
}

function computeMainIdentifierDependencies<
  Node extends TSESTree.Node,
  T extends Pick<SortingNodeWithDependencies<Node>, 'node'>,
>({
  referencingSortingNode,
  sortingNodes,
  resolved,
}: {
  resolved: TSESLint.Scope.Variable
  referencingSortingNode: T
  sortingNodes: T[]
}): T[] {
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
