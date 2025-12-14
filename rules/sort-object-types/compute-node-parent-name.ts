import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ObjectTypeParent } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name of an object-type-like parent node.
 *
 * @param node - The AST node representing an object-type-like node.
 * @param sourceCode - ESLint source code object for text extraction.
 * @returns The name of the object-type like node.
 */
export function computeNodeParentName(
  node: ObjectTypeParent,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      return node.id.name
    case AST_NODE_TYPES.TSPropertySignature:
    case AST_NODE_TYPES.PropertyDefinition:
      return computePropertyName(node, sourceCode)
    case AST_NODE_TYPES.VariableDeclarator:
      return computeVariableDeclaratorName(node, sourceCode)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computePropertyName(
  propertySignature: TSESTree.TSPropertySignature | TSESTree.PropertyDefinition,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (propertySignature.key.type) {
    case AST_NODE_TYPES.Identifier:
      return propertySignature.key.name
    case AST_NODE_TYPES.Literal:
      return String(propertySignature.key.value)
    /* v8 ignore next 2 -- @preserve Unsure how we can reach that case */
    default:
      return sourceCode.getText(propertySignature.key)
  }
}

function computeVariableDeclaratorName(
  variableDeclarator: TSESTree.VariableDeclarator,
  sourceCode: TSESLint.SourceCode,
): string {
  if (!variableDeclarator.id.typeAnnotation) {
    return sourceCode.getText(variableDeclarator.id)
  }
  return sourceCode.text.slice(
    variableDeclarator.id.range[0],
    variableDeclarator.id.typeAnnotation.range[0],
  )
}
