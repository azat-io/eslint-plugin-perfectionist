import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Checks if a TypeScript type member is marked as optional.
 *
 * Determines whether a property or method signature in a TypeScript type or
 * interface is optional (marked with '?'). Used for grouping optional and
 * required members separately during sorting.
 *
 * @param node - AST node to check.
 * @returns True if the member is optional, false otherwise.
 */
export function isMemberOptional(
  node:
    | TSESTree.TSPropertySignature
    | TSESTree.TSMethodSignature
    | TSESTree.TSIndexSignature,
): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.TSPropertySignature:
    case AST_NODE_TYPES.TSMethodSignature:
      return node.optional
    case AST_NODE_TYPES.TSIndexSignature:
      return false
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}
