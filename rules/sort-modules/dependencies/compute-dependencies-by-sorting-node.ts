import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

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
import { rangeContainsRange } from '../../../utils/range-contains-range'
import { getNodeDecorators } from '../../../utils/get-node-decorators'
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

    /**
     * Checks whether the identifier is evaluated when the sorting node is
     * defined. Every class element between them, including the elements of
     * nested classes, must be evaluated when its own class is defined.
     *
     * @returns True if the identifier is evaluated when the sorting node is
     *   defined.
     */
    function isInRelevantClassContext(): boolean {
      let classElements = computeParentNodesWithTypes({
        allowedTypes: [
          AST_NODE_TYPES.PropertyDefinition,
          AST_NODE_TYPES.AccessorProperty,
          AST_NODE_TYPES.MethodDefinition,
        ],
        maxParent: referencingSortingNode.node,
        consecutiveOnly: false,
        node: identifier,
      })
      return classElements.every(classElement =>
        isClassElementRelevant(classElement),
      )
    }

    function isClassElementRelevant(
      classElement:
        | TSESTree.PropertyDefinition
        | TSESTree.AccessorProperty
        | TSESTree.MethodDefinition,
    ): boolean {
      if (
        classElement.type !== AST_NODE_TYPES.MethodDefinition &&
        !isArrowFunctionNode(classElement)
      ) {
        return true
      }

      if (isEvaluatedWithClassDefinition(classElement)) {
        return true
      }

      return (
        classElement.static &&
        shouldSearchStaticMethodsAndFunctionProperties(classElement.parent)
      )
    }

    /**
     * Checks whether the identifier is in a decorator, a computed key or a
     * parameter decorator of a function class element. These parts are
     * evaluated when the class is defined, unlike the function body.
     *
     * @param classElement - The method or the arrow function property.
     * @returns True if the identifier is evaluated when the class is defined.
     */
    function isEvaluatedWithClassDefinition(
      classElement:
        | TSESTree.PropertyDefinition
        | TSESTree.AccessorProperty
        | TSESTree.MethodDefinition,
    ): boolean {
      let parameters =
        classElement.type === AST_NODE_TYPES.MethodDefinition ?
          classElement.value.params
        : []
      return [
        ...parameters.flatMap(parameter => getNodeDecorators(parameter)),
        ...getNodeDecorators(classElement),
        classElement.key,
      ].some(node => rangeContainsRange(node.range, identifier.range))
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

/**
 * Checks whether the static methods and function properties of a class can run
 * when the class is defined: the class has a static block or a static property
 * that is not an arrow function.
 *
 * @param classBody - The body of the class whose static elements are checked.
 * @returns True if static methods and function properties can run when the
 *   class is defined.
 */
function shouldSearchStaticMethodsAndFunctionProperties(
  classBody: TSESTree.ClassBody,
): boolean {
  return classBody.body.some(
    classElement =>
      classElement.type === AST_NODE_TYPES.StaticBlock ||
      (classElement.static &&
        isPropertyOrAccessorNode(classElement) &&
        !isArrowFunctionNode(classElement)),
  )
}
