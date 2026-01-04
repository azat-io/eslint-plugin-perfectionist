import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { AdditionalIdentifierDependenciesComputer } from '../../utils/compute-dependencies-by-sorting-node'
import type { SortEnumsSortingNode } from './types'

import { computeDependenciesBySortingNode as baseComputeDependenciesBySortingNode } from '../../utils/compute-dependencies-by-sorting-node'
import { computeConsecutiveParentNodesByType } from '../../utils/compute-consecutive-parent-nodes-by-type'

type SortingNodeWithoutDependencies = Omit<SortEnumsSortingNode, 'dependencies'>

export function computeDependenciesBySortingNode({
  sortingNodes,
  sourceCode,
  enumName,
}: {
  sortingNodes: SortingNodeWithoutDependencies[]
  sourceCode: TSESLint.SourceCode
  enumName: string
}): Map<SortingNodeWithoutDependencies, SortingNodeWithoutDependencies[]> {
  return baseComputeDependenciesBySortingNode({
    additionalIdentifierDependenciesComputer:
      buildAdditionalIdentifierDependenciesComputer({
        sortingNodes,
        enumName,
      }),
    sortingNodes,
    sourceCode,
  })
}

function buildAdditionalIdentifierDependenciesComputer({
  sortingNodes,
  enumName,
}: {
  sortingNodes: SortingNodeWithoutDependencies[]
  enumName: string
}): AdditionalIdentifierDependenciesComputer<SortingNodeWithoutDependencies> {
  return ({ identifier }) => {
    if (identifier.name !== enumName) {
      return []
    }

    let relatedIdentifiers = computeMemberExpressionIdentifiers(identifier)
    return sortingNodes.filter(sortingNode =>
      doesNodeHaveOneOfDependencyNames(sortingNode, relatedIdentifiers),
    )
  }
}

function computeMemberExpressionIdentifiers(
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier,
): string[] {
  return computeConsecutiveParentNodesByType(
    identifier,
    AST_NODE_TYPES.MemberExpression,
  )
    .map(node => node.property)
    .filter(property => property.type === AST_NODE_TYPES.Identifier)
    .map(property => property.name)
}

function doesNodeHaveOneOfDependencyNames(
  sortingNode: SortingNodeWithoutDependencies,
  dependencyNames: string[],
): boolean {
  let nodeDependencyNames = new Set(sortingNode.dependencyNames)
  return dependencyNames.some(dependencyName =>
    nodeDependencyNames.has(dependencyName),
  )
}
