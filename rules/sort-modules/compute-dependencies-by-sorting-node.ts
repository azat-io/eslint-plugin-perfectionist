import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type {
  AdditionalIdentifierDependenciesComputer,
  ShouldIgnoreSortingNodeComputer,
  ShouldIgnoreIdentifierComputer,
} from '../../utils/compute-dependencies-by-sorting-node'
import type { SortModulesSortingNode, DependencyDetection } from './types'

import { computeDependenciesBySortingNode as baseComputeDependenciesBySortingNode } from '../../utils/compute-dependencies-by-sorting-node'
import { doesSortingNodeHaveOneOfDependencyNames } from '../../utils/does-sorting-node-have-one-of-dependency-names'
import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { isPropertyOrAccessorNode } from './is-property-or-accessor-node'
import { isArrowFunctionNode } from './is-arrow-function-node'

type SortingNodeWithoutDependencies = Omit<
  SortModulesSortingNode,
  'dependencies'
>

export function computeDependenciesBySortingNode({
  dependencyDetection,
  sortingNodes,
  sourceCode,
}: {
  sortingNodes: SortingNodeWithoutDependencies[]
  dependencyDetection: DependencyDetection
  sourceCode: TSESLint.SourceCode
}): Map<SortingNodeWithoutDependencies, SortingNodeWithoutDependencies[]> {
  return baseComputeDependenciesBySortingNode({
    additionalIdentifierDependenciesComputer:
      buildAdditionalIdentifierDependenciesComputer({ sortingNodes }),
    shouldIgnoreSortingNodeComputer:
      buildShouldIgnoreSortingNodeComputer(dependencyDetection),
    shouldIgnoreIdentifierComputer:
      buildShouldIgnoreIdentifierComputer(dependencyDetection),
    sortingNodes,
    sourceCode,
  })
}

function buildShouldIgnoreIdentifierComputer(
  dependencyDetection: DependencyDetection,
): ShouldIgnoreIdentifierComputer<SortingNodeWithoutDependencies> {
  return ({ referencingSortingNode, identifier }) => {
    switch (dependencyDetection) {
      case 'soft':
        return false
      case 'hard':
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
  sortingNodes: SortingNodeWithoutDependencies[]
}): AdditionalIdentifierDependenciesComputer<SortingNodeWithoutDependencies> {
  return ({ identifier }) => {
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
        consecutiveOnly: true,
        node: identifier,
        maxParent: null,
      })
        .map(node => node.property)
        .filter(property => property.type === AST_NODE_TYPES.Identifier)
        .map(property => property.name)
    }

    function computeQualifiedNameIdentifiers(): string[] {
      return computeParentNodesWithTypes({
        allowedTypes: [AST_NODE_TYPES.TSQualifiedName],
        consecutiveOnly: true,
        node: identifier,
        maxParent: null,
      }).map(node => node.right.name)
    }
  }
}

function buildShouldIgnoreSortingNodeComputer(
  dependencyDetection: DependencyDetection,
): ShouldIgnoreSortingNodeComputer<SortingNodeWithoutDependencies> {
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
