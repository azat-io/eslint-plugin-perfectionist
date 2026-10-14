import type { TSESTree } from '@typescript-eslint/types'

import { AST_NODE_TYPES } from '@typescript-eslint/types'

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
  return (
    node.type === AST_NODE_TYPES.ObjectPattern && mayContainReferences(node)
  )
}

function mayContainReferences(node: TSESTree.Node): boolean {
  let pattern = node.type === AST_NODE_TYPES.RestElement ? node.argument : node
  switch (pattern.type) {
    case AST_NODE_TYPES.ObjectPattern:
      return pattern.properties.some(property =>
        property.type === AST_NODE_TYPES.RestElement ?
          mayContainReferences(property)
        : property.computed || mayContainReferences(property.value),
      )
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
