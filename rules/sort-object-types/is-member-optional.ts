import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

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
export function isMemberOptional(node: TSESTree.Node): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.TSPropertySignature:
    case AST_NODE_TYPES.TSMethodSignature:
      return node.optional
  }

  return false
}
