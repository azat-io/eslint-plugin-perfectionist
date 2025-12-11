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
    case AST_NODE_TYPES.TSTypeAnnotation:
      return sourceCode.text.slice(node.parent.range[0], node.range[0])
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}
