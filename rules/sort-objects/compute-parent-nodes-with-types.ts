import type { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { TSESTree } from '@typescript-eslint/types'

/** Helper type for a node with a specific AST node type. */
type NodeOfType<Type> = { type: Type } & TSESTree.Node

/**
 * Finds all parent nodes matching one of the specified AST node types.
 *
 * @param options - Options for the search.
 * @param options.allowedTypes - Array of AST node types to match.
 * @param options.node - Starting node to search from.
 * @returns List of matching parent nodes.
 */
export function computeParentNodesWithTypes<NodeType extends AST_NODE_TYPES>({
  allowedTypes,
  node,
}: {
  allowedTypes: NodeType[]
  node: TSESTree.Node
}): NodeOfType<NodeType>[] {
  let allowedTypesSet = new Set<string>(allowedTypes)
  let returnValue: NodeOfType<NodeType>[] = []

  let { parent } = node
  while (parent) {
    if (allowedTypesSet.has(parent.type)) {
      returnValue.push(parent as NodeOfType<NodeType>)
    }
    ;({ parent } = parent)
  }

  return returnValue
}
