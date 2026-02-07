import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Checks whether a class element is supported by the sort-classes rule.
 *
 * Unknown elements should be treated as partition boundaries to avoid
 * reordering across them and to prevent rule crashes with non-standard
 * parsers.
 *
 * @param member - The class element to check.
 * @returns True when the element is a known, supported class member.
 */
export function isKnownClassElement(
  member: TSESTree.ClassElement | { type: string },
): boolean {
  switch (member.type) {
    case AST_NODE_TYPES.TSAbstractPropertyDefinition:
    case AST_NODE_TYPES.TSAbstractMethodDefinition:
    case AST_NODE_TYPES.TSAbstractAccessorProperty:
    case AST_NODE_TYPES.PropertyDefinition:
    case AST_NODE_TYPES.MethodDefinition:
    case AST_NODE_TYPES.AccessorProperty:
    case AST_NODE_TYPES.TSIndexSignature:
    case AST_NODE_TYPES.StaticBlock:
      return true
    default:
      return false
  }
}
