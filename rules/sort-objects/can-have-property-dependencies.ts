import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

import { UnreachableCaseError } from '../../utils/unreachable-case-error'

/**
 * Checks whether a property can reference a variable declared by another one,
 * which only pattern default values and computed keys can do.
 *
 * @param node - The object node.
 * @returns True if properties may depend on each other.
 */
export function canHavePropertyDependencies(
  node: TSESTree.ObjectExpression | TSESTree.ObjectPattern,
): boolean {
  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    return false
  }

  return mayContainReferences(node)
}

function mayContainReferences(
  node:
    | TSESTree.PropertyNonComputedName['value']
    | TSESTree.ObjectPattern
    | TSESTree.RestElement,
): boolean {
  let pattern = node.type === AST_NODE_TYPES.RestElement ? node.argument : node

  switch (pattern.type) {
    case AST_NODE_TYPES.ObjectPattern:
      return pattern.properties.some(mayObjectPatternPropertyContainReferences)
    case AST_NODE_TYPES.ArrayPattern:
      return pattern.elements.some(
        element => element !== null && mayContainReferences(element),
      )
    case AST_NODE_TYPES.Identifier:
      return false
    default:
      return true
  }
}

function mayObjectPatternPropertyContainReferences(
  node: TSESTree.RestElement | TSESTree.Property,
): boolean {
  switch (node.type) {
    case AST_NODE_TYPES.RestElement:
      return mayContainReferences(node)
    case AST_NODE_TYPES.Property:
      return node.computed || mayContainReferences(node.value)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(node)
  }
}
