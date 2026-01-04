import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { AdditionalIdentifierDependenciesComputer } from '../../utils/compute-dependencies-by-sorting-node'
import type { SortEnumsSortingNode } from './types'

import { computeDependenciesBySortingNode as baseComputeDependenciesBySortingNode } from '../../utils/compute-dependencies-by-sorting-node'
import { doesSortingNodeHaveOneOfDependencyNames } from '../../utils/does-sorting-node-have-one-of-dependency-names'
import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'

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
  return ({ referencingSortingNode, identifier }) => {
    if (identifier.name !== enumName) {
      return []
    }

    let relatedIdentifiers = computeMemberExpressionIdentifiers(
      identifier,
      referencingSortingNode,
    )
    return sortingNodes.filter(sortingNode =>
      doesSortingNodeHaveOneOfDependencyNames(sortingNode, relatedIdentifiers),
    )
  }
}

function computeMemberExpressionIdentifiers(
  identifier: TSESTree.JSXIdentifier | TSESTree.Identifier,
  referencingSortingNode: SortingNodeWithoutDependencies,
): string[] {
  return computeParentNodesWithTypes({
    allowedTypes: [AST_NODE_TYPES.MemberExpression],
    maxParent: referencingSortingNode.node,
    consecutiveOnly: true,
    node: identifier,
  })
    .map(node => node.property)
    .filter(property => property.type === AST_NODE_TYPES.Identifier)
    .map(property => property.name)
}
