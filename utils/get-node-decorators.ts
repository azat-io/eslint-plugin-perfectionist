import type { TSESTree } from '@typescript-eslint/types'

/**
 * Type representing an AST node that may have decorators.
 *
 * Extends the base Node type with an optional decorators array. Used for
 * TypeScript/JavaScript decorators on classes, methods, and properties.
 */
type NodeWithDecorator = {
  decorators: TSESTree.Decorator[]
} & TSESTree.Node

/**
 * Safely retrieves decorators from an AST node.
 *
 * Provides a safe way to access the decorators property which may not exist on
 * all nodes or in all parser versions. Returns an empty array when decorators
 * are undefined, ensuring consistent behavior across different AST structures.
 *
 * @example
 *   // Class with decorators
 *
 * @example
 *   // Node without decorators
 *   const plainMethod = { type: 'MethodDefinition', ... };
 *   getNodeDecorators(plainMethod);
 *   // Returns: []
 *
 * @param node - AST node that may contain decorators.
 * @returns Array of decorator nodes, empty array if none exist.
 */
export function getNodeDecorators(
  node: NodeWithDecorator,
): TSESTree.Decorator[] {
  /* v8 ignore next 2 */
  // eslint-disable-next-line typescript/no-unnecessary-condition
  return node.decorators ?? []
}
