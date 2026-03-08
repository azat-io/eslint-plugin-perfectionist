import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ObjectParent, MessageId, Options } from './types'

import { passesAllNamesMatchPatternFilter } from '../../utils/context-matching/passes-all-names-match-pattern-filter'
import { computePropertyOrVariableDeclaratorName } from './compute-property-or-variable-declarator-name'
import { passesCallingFunctionNamePatternFilter } from './passes-calling-function-name-pattern-filter'
import { passesDeclarationMatchesPatternFilter } from './passes-declaration-matches-pattern-filter'
import { passesDeclarationCommentMatchesFilter } from './passes-declaration-comment-matches-filter'
import { passesAstSelectorFilter } from '../../utils/context-matching/passes-ast-selector-filter'
import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { objectParentTypes } from './types'

/**
 * Computes the matched context options for a given object node.
 *
 * @param params - Parameters.
 * @param params.isDestructuredObject - Whether the object is destructured.
 * @param params.matchedAstSelectors - The matched AST selectors for an object
 *   node.
 * @param params.sourceCode - The source code object.
 * @param params.nodeObject - The object node to evaluate.
 * @param params.context - The rule context.
 * @returns The matched context options or undefined if none match.
 */
export function computeMatchedContextOptions({
  isDestructuredObject,
  matchedAstSelectors,
  sourceCode,
  nodeObject,
  context,
}: {
  nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  context: TSESLint.RuleContext<MessageId, Options>
  matchedAstSelectors: ReadonlySet<string>
  sourceCode: TSESLint.SourceCode
  isDestructuredObject: boolean
}): Options[number] | undefined {
  let nodeNames = nodeObject.properties
    .filter(
      property =>
        property.type !== AST_NODE_TYPES.SpreadElement &&
        property.type !== AST_NODE_TYPES.RestElement,
    )
    .map(property =>
      computePropertyOrVariableDeclaratorName({ node: property, sourceCode }),
    )

  let parentNodes = computeParentNodesWithTypes({
    allowedTypes: [...objectParentTypes],
    consecutiveOnly: false,
    node: nodeObject,
    maxParent: null,
  })

  return context.options.find(options =>
    isContextOptionMatching({
      isDestructuredObject,
      matchedAstSelectors,
      parentNodes,
      sourceCode,
      nodeObject,
      nodeNames,
      options,
    }),
  )
}

function isContextOptionMatching({
  isDestructuredObject,
  matchedAstSelectors,
  parentNodes,
  sourceCode,
  nodeObject,
  nodeNames,
  options,
}: {
  nodeObject: TSESTree.ObjectExpression | TSESTree.ObjectPattern
  matchedAstSelectors: ReadonlySet<string>
  sourceCode: TSESLint.SourceCode
  isDestructuredObject: boolean
  parentNodes: ObjectParent[]
  options: Options[number]
  nodeNames: string[]
}): boolean {
  if (!options.useConfigurationIf) {
    return true
  }

  return (
    passesAllNamesMatchPatternFilter({
      allNamesMatchPattern: options.useConfigurationIf.allNamesMatchPattern,
      nodeNames,
    }) &&
    passesObjectTypeFilter({
      objectType: options.useConfigurationIf.objectType,
      isDestructuredObject,
    }) &&
    passesCallingFunctionNamePatternFilter({
      callingFunctionNamePattern:
        options.useConfigurationIf.callingFunctionNamePattern,
      parentNodes,
      sourceCode,
    }) &&
    passesDeclarationMatchesPatternFilter({
      declarationMatchesPattern:
        options.useConfigurationIf.declarationMatchesPattern,
      parentNodes,
      sourceCode,
    }) &&
    passesHasNumericKeysOnlyFilter({
      hasNumericKeysOnlyFilter: options.useConfigurationIf.hasNumericKeysOnly,
      object: nodeObject,
    }) &&
    passesDeclarationCommentMatchesFilter({
      declarationCommentMatchesPattern:
        options.useConfigurationIf.declarationCommentMatchesPattern,
      parentNodes,
      sourceCode,
    }) &&
    passesAstSelectorFilter({
      matchesAstSelector: options.useConfigurationIf.matchesAstSelector,
      matchedAstSelectors,
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
