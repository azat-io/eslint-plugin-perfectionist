import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Checks if a type node contains a callable type (function or constructor).
 *
 * @param typeNode - The type node to check.
 * @returns True if the type node contains a callable type, false otherwise.
 */
export function typeContainsCallableType(typeNode: TSESTree.TypeNode): boolean {
  switch (typeNode.type) {
    case AST_NODE_TYPES.TSConstructorType:
    case AST_NODE_TYPES.TSFunctionType:
      return true
    case AST_NODE_TYPES.TSTypeLiteral:
      return typeNode.members.some(typeElementContainsCallableType)
    default:
      return false
  }

  function typeElementContainsCallableType(
    member: TSESTree.TypeElement,
  ): boolean {
    switch (member.type) {
      case AST_NODE_TYPES.TSConstructSignatureDeclaration:
      case AST_NODE_TYPES.TSIndexSignature:
        return false
      case AST_NODE_TYPES.TSCallSignatureDeclaration:
      case AST_NODE_TYPES.TSMethodSignature:
        return true
      case AST_NODE_TYPES.TSPropertySignature:
        return !!(
          member.typeAnnotation &&
          typeContainsCallableType(member.typeAnnotation.typeAnnotation)
        )
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(member)
    }
  }
}
