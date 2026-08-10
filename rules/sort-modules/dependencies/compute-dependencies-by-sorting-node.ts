import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  AdditionalIdentifierDependenciesComputer,
  ShouldIgnoreSortingNodeComputer,
  ShouldIgnoreIdentifierComputer,
} from '../../../utils/compute-dependencies-by-sorting-node'
import type { DependencyDetection } from '../types'

import {
  type SortModulesSortingNodeWithoutDependencies,
  isIdentifierInDecoratorMetadataTypePosition,
} from './is-identifier-in-decorator-metadata-type-position'
import { computeDependenciesBySortingNode as baseComputeDependenciesBySortingNode } from '../../../utils/compute-dependencies-by-sorting-node'
import { doesSortingNodeHaveOneOfDependencyNames } from '../../../utils/does-sorting-node-have-one-of-dependency-names'
import { computeParentNodesWithTypes } from '../../../utils/compute-parent-nodes-with-types'
import { UnreachableCaseError } from '../../../utils/unreachable-case-error'
import { isPropertyOrAccessorNode } from '../is-property-or-accessor-node'
import { isArrowFunctionNode } from '../is-arrow-function-node'

type HardDependencyDetectionParameters = {
  emitDecoratorMetadata: boolean
  dependencyDetection: 'hard'
} & CommonParameters
type SoftDependencyDetectionParameters = {
  emitDecoratorMetadata?: never
  dependencyDetection: 'soft'
} & CommonParameters
interface CommonParameters {
  sortingNodes: SortModulesSortingNodeWithoutDependencies[]
  sourceCode: TSESLint.SourceCode
}
type Parameters =
  SoftDependencyDetectionParameters | HardDependencyDetectionParameters

export function computeDependenciesBySortingNode({
  emitDecoratorMetadata,
  dependencyDetection,
  sortingNodes,
  sourceCode,
}: Parameters): Map<
  SortModulesSortingNodeWithoutDependencies,
  SortModulesSortingNodeWithoutDependencies[]
> {
  return baseComputeDependenciesBySortingNode({
    shouldIgnoreIdentifierComputer: buildShouldIgnoreIdentifierComputer({
      emitDecoratorMetadata,
      dependencyDetection,
      sortingNodes,
    }),
    additionalIdentifierDependenciesComputer:
      buildAdditionalIdentifierDependenciesComputer({ sortingNodes }),
    shouldIgnoreSortingNodeComputer:
      buildShouldIgnoreSortingNodeComputer(dependencyDetection),
    sortingNodes,
    sourceCode,
  })
}

function buildShouldIgnoreIdentifierComputer({
  emitDecoratorMetadata,
  dependencyDetection,
  sortingNodes,
}: Pick<
  Parameters,
  'emitDecoratorMetadata' | 'dependencyDetection' | 'sortingNodes'
>): ShouldIgnoreIdentifierComputer<SortModulesSortingNodeWithoutDependencies> {
  return ({ referencingSortingNode, identifier }) => {
    switch (dependencyDetection) {
      case 'soft':
        return false
      case 'hard':
        if (
          emitDecoratorMetadata &&
          isIdentifierInDecoratorMetadataTypePosition({
            sortingNodes,
            identifier,
          })
        ) {
          return false
        }

        if (
          identifier.parent.type === AST_NODE_TYPES.TSTypeReference &&
          identifier.parent.typeName === identifier
        ) {
          return true
        }

        return !isInRelevantClassContext()
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(dependencyDetection)
    }

    function isInRelevantClassContext(): boolean {
      let relevantParentNodes = computeParentNodesWithTypes({
        allowedTypes: [
          AST_NODE_TYPES.ClassBody,
          AST_NODE_TYPES.PropertyDefinition,
          AST_NODE_TYPES.AccessorProperty,
          AST_NODE_TYPES.MethodDefinition,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ],
        maxParent: referencingSortingNode.node,
        consecutiveOnly: false,
        node: identifier,
      })
      let firstClassBodyParent = relevantParentNodes.findIndex(
        parentNode => parentNode.type === AST_NODE_TYPES.ClassBody,
      )
      if (firstClassBodyParent < 0) {
        return true
      }
      let classBody = relevantParentNodes[
        firstClassBodyParent
      ] as TSESTree.ClassBody

      let searchStaticMethodsAndFunctionProperties = classBody.body.some(
        classElement =>
          classElement.type === AST_NODE_TYPES.StaticBlock ||
          (classElement.static &&
            isPropertyOrAccessorNode(classElement) &&
            !isArrowFunctionNode(classElement)),
      )

      let otherParents = relevantParentNodes.slice(0, firstClassBodyParent)
      return otherParents.every(otherParent =>
        isClassElementRelevant(
          otherParent,
          searchStaticMethodsAndFunctionProperties,
        ),
      )
    }

    function isClassElementRelevant(
      classElement:
        | TSESTree.ArrowFunctionExpression
        | TSESTree.PropertyDefinition
        | TSESTree.AccessorProperty
        | TSESTree.MethodDefinition
        | TSESTree.ClassBody,
      searchStaticMethodsAndFunctionProperties: boolean,
    ): boolean {
      if (
        classElement.type !== AST_NODE_TYPES.MethodDefinition &&
        !isArrowFunctionNode(classElement)
      ) {
        return true
      }

      return classElement.static && searchStaticMethodsAndFunctionProperties
    }
  }
}

function buildAdditionalIdentifierDependenciesComputer({
  sortingNodes,
}: {
  sortingNodes: SortModulesSortingNodeWithoutDependencies[]
}): AdditionalIdentifierDependenciesComputer<SortModulesSortingNodeWithoutDependencies> {
  return ({ referencingSortingNode, reference }) => {
    let relatedIdentifiers = [
      ...computeMemberExpressionIdentifiers(),
      ...computeQualifiedNameIdentifiers(),
    ]
    return sortingNodes.filter(sortingNode =>
      doesSortingNodeHaveOneOfDependencyNames(sortingNode, relatedIdentifiers),
    )

    function computeMemberExpressionIdentifiers(): string[] {
      return computeParentNodesWithTypes({
        allowedTypes: [AST_NODE_TYPES.MemberExpression],
        maxParent: referencingSortingNode.node,
        node: reference.identifier,
        consecutiveOnly: true,
      })
        .map(node => node.property)
        .filter(property => property.type === AST_NODE_TYPES.Identifier)
        .map(property => property.name)
    }

    function computeQualifiedNameIdentifiers(): string[] {
      return computeParentNodesWithTypes({
        allowedTypes: [AST_NODE_TYPES.TSQualifiedName],
        maxParent: referencingSortingNode.node,
        node: reference.identifier,
        consecutiveOnly: true,
      }).map(node => node.right.name)
    }
  }
}

function buildShouldIgnoreSortingNodeComputer(
  dependencyDetection: DependencyDetection,
): ShouldIgnoreSortingNodeComputer<SortModulesSortingNodeWithoutDependencies> {
  return sortingNode => {
    switch (dependencyDetection) {
      case 'hard':
        return sortingNode.dependencyDetection !== 'hard'
      case 'soft':
        return false
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(dependencyDetection)
    }
  }
}
