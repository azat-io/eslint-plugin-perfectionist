import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Compute the name for a property-like node.
 *
 * @param node - Starting node to search from.
 * @returns The property name, or null if it cannot be determined.
 */
export function computePropertyName(
  node: TSESTree.VariableDeclarator | TSESTree.Property,
): string | null {
  switch (node.type) {
    case AST_NODE_TYPES.VariableDeclarator:
      return computeIdentifierName(node.id)
    case AST_NODE_TYPES.Property:
      return computeIdentifierName(node.key)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}

function computeIdentifierName(
  node: TSESTree.VariableDeclarator['id'] | TSESTree.Property['key'],
): string | null {
  if (node.type !== AST_NODE_TYPES.Identifier) {
    return null
  }

  return node.name
}
