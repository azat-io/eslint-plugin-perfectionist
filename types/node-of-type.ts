import type { TSESTree } from '@typescript-eslint/types'

/**
 * Helper type for a node with a specific AST node type.
 */
export type NodeOfType<Type> = { type: Type } & TSESTree.Node
