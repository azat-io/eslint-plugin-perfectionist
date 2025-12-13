import type { TSESTree } from '@typescript-eslint/types'
import type { TSESLint } from '@typescript-eslint/utils'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ObjectTypeParentForDeclarationMatch } from './types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Computes the name of an object-type-like parent node.
 *
 * @param node - The AST node representing an object-type-like node.
 * @param sourceCode - ESLint source code object for text extraction.
 * @returns The name of the object-type like node.
 */
export function computeNodeParentName(
  node: ObjectTypeParentForDeclarationMatch,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (node.type) {
    case AST_NODE_TYPES.TSTypeAliasDeclaration:
    case AST_NODE_TYPES.TSInterfaceDeclaration:
      return node.id.name
    case AST_NODE_TYPES.VariableDeclarator:
      return sourceCode.getText(node.id)
    case AST_NODE_TYPES.TSTypeAnnotation:
      return computeTypeAnnotationName(node, sourceCode)
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

function computeTypeAnnotationName(
  typeAnnotation: TSESTree.TSTypeAnnotation,
  sourceCode: TSESLint.SourceCode,
): string {
  switch (typeAnnotation.parent.type) {
    case AST_NODE_TYPES.TSPropertySignature:
    case AST_NODE_TYPES.PropertyDefinition:
      return computePropertyName(typeAnnotation.parent, sourceCode)
    default:
      return sourceCode.text.slice(
        typeAnnotation.parent.range[0],
        typeAnnotation.range[0],
      )
  }
}
