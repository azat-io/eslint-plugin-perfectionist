import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_TOKEN_TYPES, AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { AdditionalIdentifierDependenciesComputer } from '../../utils/compute-dependencies-by-sorting-node'
import type { SortClassesSortingNode, NodeNameDetails } from './types'
import type { RegexOption } from '../../types/common-options'

import { computeDependenciesBySortingNode as baseComputeDependenciesBySortingNode } from '../../utils/compute-dependencies-by-sorting-node'
import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { computeIdentifierNameDetails } from './compute-identifier-name-details'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { matches } from '../../utils/matches'

type SortingNodeWithoutDependencies = Omit<
  SortClassesSortingNode,
  'dependencies'
>

export function computeDependenciesBySortingNode({
  ignoreCallbackDependenciesPatterns,
  sortingNodes,
  sourceCode,
  classBody,
}: {
  ignoreCallbackDependenciesPatterns: RegexOption
  sortingNodes: SortingNodeWithoutDependencies[]
  sourceCode: TSESLint.SourceCode
  classBody: TSESTree.ClassBody
}): Map<SortingNodeWithoutDependencies, SortingNodeWithoutDependencies[]> {
  let staticSortingNodes = sortingNodes.filter(node => node.isStatic)
  let dependenciesBySortingNode = baseComputeDependenciesBySortingNode({
    additionalIdentifierDependenciesComputer:
      buildAdditionalIdentifierDependenciesComputer({
        ignoreCallbackDependenciesPatterns,
        staticSortingNodes,
        classBody,
      }),
    shouldIgnoreSortingNodeComputer: sortingNode =>
      shouldIgnoreDependencyComputation(sortingNode.node),
    sortingNodes,
    sourceCode,
  })

  let thisDependenciesBySortingNode =
    computeThisExpressionDependenciesBySortingNode({
      ignoreCallbackDependenciesPatterns,
      sortingNodes,
      sourceCode,
    })
  for (let [sortingNode, dependencies] of thisDependenciesBySortingNode) {
    let existingDependencies = dependenciesBySortingNode.get(sortingNode) ?? []
    dependenciesBySortingNode.set(sortingNode, [
      ...existingDependencies,
      ...dependencies,
    ])
  }

  return dependenciesBySortingNode
}

export function computeThisExpressionsInsideClassElement({
  classElement,
  sourceCode,
}: {
  classElement: TSESTree.ClassElement
  sourceCode: TSESLint.SourceCode
}): TSESTree.ThisExpression[] {
  let thisTokens = sourceCode.getTokens(classElement).filter(isThisToken)

  return thisTokens
    .map(computeTokenNode)
    .filter(node => node?.type === AST_NODE_TYPES.ThisExpression)

  function computeTokenNode(token: TSESTree.Token): TSESTree.Node | null {
    return sourceCode.getNodeByRangeIndex(token.range[0])
  }
  function isThisToken(token: TSESTree.Token): boolean {
    return token.type === AST_TOKEN_TYPES.Keyword && token.value === 'this'
  }
}

function computeIdentifierOrThisExpressionDependency({
  ignoreCallbackDependenciesPatterns,
  sortingNodes,
  classElement,
  node,
}: {
  node: TSESTree.ThisExpression | TSESTree.JSXIdentifier | TSESTree.Identifier
  ignoreCallbackDependenciesPatterns: RegexOption
  sortingNodes: SortingNodeWithoutDependencies[]
  classElement: TSESTree.ClassElement
}): SortingNodeWithoutDependencies | null {
  if (shouldIgnoreCallbackDependency()) {
    return null
  }

  let { parent } = node
  /* v8 ignore if -- @preserve Unsure how we can reach that case */
  if (parent.type !== AST_NODE_TYPES.MemberExpression) {
    return null
  }

  let dependencyName = computeDependencyNameFromMemberExpression(parent)
  /* v8 ignore if -- @preserve Unsure how we can reach that case */
  if (!dependencyName) {
    return null
  }

  return (
    sortingNodes.find(
      currentSortingNode => currentSortingNode.name === dependencyName.name,
    ) ?? null
  )

  function computeDependencyNameFromMemberExpression(
    memberExpression: TSESTree.MemberExpression,
  ): NodeNameDetails | null {
    switch (memberExpression.property.type) {
      case AST_NODE_TYPES.PrivateIdentifier:
      case AST_NODE_TYPES.Identifier:
      case AST_NODE_TYPES.Literal:
        return computeIdentifierNameDetails(memberExpression.property)
      /* v8 ignore next 2 -- @preserve Unhandled cases */
      default:
        return null
    }
  }
  function shouldIgnoreCallbackDependency(): boolean {
    let [firstCallExpressionParent] = computeParentNodesWithTypes({
      allowedTypes: [AST_NODE_TYPES.CallExpression],
      maxParent: classElement,
      consecutiveOnly: false,
      node,
    })
    if (!firstCallExpressionParent) {
      return false
    }

    if (!('name' in firstCallExpressionParent.callee)) {
      return false
    }

    return matches(
      firstCallExpressionParent.callee.name,
      ignoreCallbackDependenciesPatterns,
    )
  }
}

function computeThisExpressionDependenciesBySortingNode({
  ignoreCallbackDependenciesPatterns,
  sortingNodes,
  sourceCode,
}: {
  ignoreCallbackDependenciesPatterns: RegexOption
  sortingNodes: SortingNodeWithoutDependencies[]
  sourceCode: TSESLint.SourceCode
}): Map<SortingNodeWithoutDependencies, SortingNodeWithoutDependencies[]> {
  let dependenciesBySortingNode = new Map<
    SortingNodeWithoutDependencies,
    SortingNodeWithoutDependencies[]
  >()
  let staticSortingNodes = sortingNodes.filter(node => node.isStatic)
  let nonStaticSortingNodes = sortingNodes.filter(node => !node.isStatic)

  let relevantSortingNodes = sortingNodes.filter(
    sortingNode => !shouldIgnoreDependencyComputation(sortingNode.node),
  )
  for (let sortingNode of relevantSortingNodes) {
    let thisExpressions = computeThisExpressionsInsideClassElement({
      classElement: sortingNode.node,
      sourceCode,
    })

    let dependencies = thisExpressions
      .map(thisExpression =>
        computeIdentifierOrThisExpressionDependency({
          sortingNodes:
            sortingNode.isStatic ? staticSortingNodes : nonStaticSortingNodes,
          ignoreCallbackDependenciesPatterns,
          classElement: sortingNode.node,
          node: thisExpression,
        }),
      )
      .filter(dependency => dependency !== null)
    if (dependencies.length === 0) {
      continue
    }

    dependenciesBySortingNode.set(sortingNode, dependencies)
  }
  return dependenciesBySortingNode
}

function buildAdditionalIdentifierDependenciesComputer({
  ignoreCallbackDependenciesPatterns,
  staticSortingNodes,
  classBody,
}: {
  staticSortingNodes: SortingNodeWithoutDependencies[]
  ignoreCallbackDependenciesPatterns: RegexOption
  classBody: TSESTree.ClassBody
}): AdditionalIdentifierDependenciesComputer<SortingNodeWithoutDependencies> {
  return ({ referencingSortingNode, reference }) => {
    let resolvedClassIdentifier = reference.resolved?.identifiers[0]
    if (!resolvedClassIdentifier) {
      return []
    }

    let classIdentifier = classBody.parent.id
    if (reference.resolved?.identifiers[0] !== classIdentifier) {
      return []
    }

    let dependency = computeIdentifierOrThisExpressionDependency({
      classElement: referencingSortingNode.node,
      ignoreCallbackDependenciesPatterns,
      sortingNodes: staticSortingNodes,
      node: reference.identifier,
    })
    return dependency ? [dependency] : []
  }
}

function shouldIgnoreDependencyComputation(
  node: TSESTree.ClassElement,
): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.TSAbstractPropertyDefinition:
    case AST_NODE_TYPES.TSAbstractMethodDefinition:
    case AST_NODE_TYPES.StaticBlock:
      return false
    case AST_NODE_TYPES.TSAbstractAccessorProperty:
    case AST_NODE_TYPES.AccessorProperty:
    case AST_NODE_TYPES.MethodDefinition:
    case AST_NODE_TYPES.TSIndexSignature:
      return true
    case AST_NODE_TYPES.PropertyDefinition:
      return (
        node.value?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node.value?.type === AST_NODE_TYPES.FunctionExpression
      )
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}
