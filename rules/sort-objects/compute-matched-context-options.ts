import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { RegexOption } from '../../types/common-options'
import type { MessageId, Options } from './types'

import { filterOptionsByDeclarationCommentMatches } from '../../utils/filter-options-by-declaration-comment-matches'
import { computePropertyOrVariableDeclaratorName } from './compute-property-or-variable-declarator-name'
import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'
import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { matches } from '../../utils/matches'

/**
 * Computes the matched context options for a given object node.
 *
 * @param params - Parameters.
 * @param params.isDestructuredObject - Whether the object is destructured.
 * @param params.sourceCode - The source code object.
 * @param params.nodeObject - The object node to evaluate.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  isDestructuredObject,
  sourceCode,
  nodeObject,
  context,
}: {
  nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  context: TSESLint.RuleContext<MessageId, Options>
  sourceCode: TSESLint.SourceCode
  isDestructuredObject: boolean
}): Options[number] | undefined {
  let filteredContextOptions = filterOptionsByAllNamesMatch({
    nodeNames: nodeObject.properties
      .filter(
        property =>
          property.type !== AST_NODE_TYPES.SpreadElement &&
          property.type !== AST_NODE_TYPES.RestElement,
      )
      .map(property =>
        computePropertyOrVariableDeclaratorName({ node: property, sourceCode }),
      ),
    contextOptions: context.options,
  })

  let objectParents = computeParentNodesWithTypes({
    allowedTypes: [
      AST_NODE_TYPES.VariableDeclarator,
      AST_NODE_TYPES.Property,
      AST_NODE_TYPES.CallExpression,
    ],
    node: nodeObject,
  })
  let parentNodeForDeclarationComment = null
  let [firstObjectParent] = objectParents
  if (firstObjectParent) {
    parentNodeForDeclarationComment =
      firstObjectParent.type === AST_NODE_TYPES.VariableDeclarator
        ? firstObjectParent.parent
        : firstObjectParent
  }
  filteredContextOptions = filterOptionsByDeclarationCommentMatches({
    parentNode: parentNodeForDeclarationComment,
    contextOptions: filteredContextOptions,
    sourceCode,
  })

  return filteredContextOptions.find(options =>
    isContextOptionMatching({
      isDestructuredObject,
      objectParents,
      sourceCode,
      nodeObject,
      options,
    }),
  )
}

function isContextOptionMatching({
  isDestructuredObject,
  objectParents,
  sourceCode,
  nodeObject,
  options,
}: {
  objectParents: (
    | TSESTree.VariableDeclarator
    | TSESTree.CallExpression
    | TSESTree.Property
  )[]
  nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  sourceCode: TSESLint.SourceCode
  isDestructuredObject: boolean
  options: Options[number]
}): boolean {
  if (!options.useConfigurationIf) {
    return true
  }

  return (
    passesObjectTypeFilter({
      objectType: options.useConfigurationIf.objectType,
      isDestructuredObject,
    }) &&
    passesCallingFunctionNamePatternFilter({
      callingFunctionNamePattern:
        options.useConfigurationIf.callingFunctionNamePattern,
      objectParents,
      sourceCode,
    }) &&
    passesDeclarationMatchesPatternFilter({
      declarationMatchesPattern:
        options.useConfigurationIf.declarationMatchesPattern,
      objectParents,
      sourceCode,
    }) &&
    passesHasNumericKeysOnlyFilter({
      hasNumericKeysOnlyFilter: options.useConfigurationIf.hasNumericKeysOnly,
      object: nodeObject,
    })
  )
}

function passesHasNumericKeysOnlyFilter({
  hasNumericKeysOnlyFilter,
  object,
}: {
  object: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  hasNumericKeysOnlyFilter: undefined | boolean
}): boolean {
  let hasOnlyNumericKeys = hasNumericKeysOnly()
  switch (hasNumericKeysOnlyFilter) {
    case undefined:
      return true
    case false:
      return !hasOnlyNumericKeys
    case true:
      return hasOnlyNumericKeys
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(hasNumericKeysOnlyFilter)
  }

  function hasNumericKeysOnly(): boolean {
    switch (object.type) {
      case AST_NODE_TYPES.ObjectExpression:
        return object.properties.every(
          property =>
            property.type === AST_NODE_TYPES.Property &&
            property.key.type === AST_NODE_TYPES.Literal &&
            typeof property.key.value === 'number',
        )
      case AST_NODE_TYPES.ObjectPattern:
        return false
      /* v8 ignore next 2 */
      default:
        throw new UnreachableCaseError(object)
    }
  }
}

function passesDeclarationMatchesPatternFilter({
  declarationMatchesPattern,
  objectParents,
  sourceCode,
}: {
  objectParents: (
    | TSESTree.VariableDeclarator
    | TSESTree.CallExpression
    | TSESTree.Property
  )[]
  declarationMatchesPattern: RegexOption | undefined
  sourceCode: TSESLint.SourceCode
}): boolean {
  if (!declarationMatchesPattern) {
    return true
  }

  let firstVariableDeclaratorParent = objectParents.find(
    parent =>
      parent.type === AST_NODE_TYPES.VariableDeclarator ||
      parent.type === AST_NODE_TYPES.Property,
  )
  if (!firstVariableDeclaratorParent) {
    return false
  }

  let nodeName = computePropertyOrVariableDeclaratorName({
    node: firstVariableDeclaratorParent,
    sourceCode,
  })

  return matches(nodeName, declarationMatchesPattern)
}

function passesCallingFunctionNamePatternFilter({
  callingFunctionNamePattern,
  objectParents,
  sourceCode,
}: {
  objectParents: (
    | TSESTree.VariableDeclarator
    | TSESTree.CallExpression
    | TSESTree.Property
  )[]
  callingFunctionNamePattern: RegexOption | undefined
  sourceCode: TSESLint.SourceCode
}): boolean {
  if (!callingFunctionNamePattern) {
    return true
  }

  let firstCallExpressionParent = objectParents.find(
    parent => parent.type === AST_NODE_TYPES.CallExpression,
  )
  if (!firstCallExpressionParent) {
    return false
  }

  return matches(
    sourceCode.getText(firstCallExpressionParent.callee),
    callingFunctionNamePattern,
  )
}

function passesObjectTypeFilter({
  isDestructuredObject,
  objectType,
}: {
  objectType: 'non-destructured' | 'destructured' | undefined
  isDestructuredObject: boolean
}): boolean {
  switch (objectType) {
    case 'non-destructured':
      return !isDestructuredObject
    case 'destructured':
      return isDestructuredObject
    case undefined:
      return true
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(objectType)
  }
}
