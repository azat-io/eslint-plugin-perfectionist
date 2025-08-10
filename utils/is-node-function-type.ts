import type { TSESTree } from '@typescript-eslint/types'

/**
 * Determines if an AST node represents a function type.
 *
 * Recursively checks if a TypeScript node represents a function or method type.
 * Handles various TypeScript type constructs including:
 *
 * - Method signatures (e.g., `method(): void`)
 * - Function types (e.g., `() => void`)
 * - Union types where all members are functions (e.g., `(() => void) | ((x:
 *   number) => void)`)
 * - Intersection types where all members are functions
 * - Property signatures with function type annotations (e.g., `prop: () =>
 *   void`).
 *
 * Used in sorting rules to identify and group function-like members separately
 * from regular properties.
 *
 * @example
 *   // Method signature
 *   const methodNode = { type: 'TSMethodSignature', ... };
 *   isNodeFunctionType(methodNode); // Returns: true
 *
 * @example
 *   // Property with function type
 *   const propNode = {
 *   type: 'TSPropertySignature',
 *   typeAnnotation: {
 *   typeAnnotation: { type: 'TSFunctionType', ... }
 *   }
 *   };
 *   isNodeFunctionType(propNode); // Returns: true
 *
 * @example
 *   // Union of function types
 *   const unionNode = {
 *   type: 'TSUnionType',
 *   types: [
 *   { type: 'TSFunctionType', ... },
 *   { type: 'TSFunctionType', ... }
 *   ]
 *   };
 *   isNodeFunctionType(unionNode); // Returns: true
 *
 * @param node - TypeScript AST node to check.
 * @returns True if the node represents a function type, false otherwise.
 */
export function isNodeFunctionType(node: TSESTree.Node): boolean {
  if (node.type === 'TSMethodSignature' || node.type === 'TSFunctionType') {
    return true
  }
  if (node.type === 'TSUnionType' || node.type === 'TSIntersectionType') {
    return node.types.every(isNodeFunctionType)
  }
  if (node.type === 'TSPropertySignature' && node.typeAnnotation) {
    return isNodeFunctionType(node.typeAnnotation.typeAnnotation)
  }
  return false
}
