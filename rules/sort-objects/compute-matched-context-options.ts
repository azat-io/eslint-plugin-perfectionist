import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { MessageId, Options } from './types'

import { filterOptionsByDeclarationCommentMatches } from '../../utils/filter-options-by-declaration-comment-matches'
import { filterOptionsByAllNamesMatch } from '../../utils/filter-options-by-all-names-match'
import { computeParentNodesWithTypes } from '../../utils/compute-parent-nodes-with-types'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { computePropertyName } from './compute-property-name'
import { computeNodeName } from './compute-node-name'
import { matches } from '../../utils/matches'

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
      .map(property => computeNodeName({ sourceCode, property })),
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

  return filteredContextOptions.find(options => {
    if (!options.useConfigurationIf) {
      return true
    }

    if (options.useConfigurationIf.objectType) {
      if (
        isDestructuredObject &&
        options.useConfigurationIf.objectType === 'non-destructured'
      ) {
        return false
      }
      if (
        !isDestructuredObject &&
        options.useConfigurationIf.objectType === 'destructured'
      ) {
        return false
      }
    }

    if (options.useConfigurationIf.callingFunctionNamePattern) {
      let firstCallExpressionParent = objectParents.find(
        parent => parent.type === AST_NODE_TYPES.CallExpression,
      )
      if (!firstCallExpressionParent) {
        return false
      }
      let patternMatches = matches(
        sourceCode.getText(firstCallExpressionParent.callee),
        options.useConfigurationIf.callingFunctionNamePattern,
      )
      if (!patternMatches) {
        return false
      }
    }

    if (options.useConfigurationIf.declarationMatchesPattern) {
      let firstVariableDeclaratorParent = objectParents.find(
        parent =>
          parent.type === AST_NODE_TYPES.VariableDeclarator ||
          parent.type === AST_NODE_TYPES.Property,
      )
      if (!firstVariableDeclaratorParent) {
        return false
      }
      let nodeName = computePropertyName(firstVariableDeclaratorParent)
      if (!nodeName) {
        return false
      }
      let patternMatches = matches(
        nodeName,
        options.useConfigurationIf.declarationMatchesPattern,
      )
      if (!patternMatches) {
        return false
      }
    }

    if (
      options.useConfigurationIf.hasNumericKeysOnly &&
      !hasNumericKeysOnly(nodeObject)
    ) {
      return false
    }

    return true
  })
}

function hasNumericKeysOnly(
  object: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
): boolean {
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
