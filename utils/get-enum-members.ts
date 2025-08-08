import type { TSESTree } from '@typescript-eslint/types'

/**
 * Retrieves enum members from a TypeScript enum declaration node.
 *
 * Handles both current and deprecated AST structures for enum declarations to
 * ensure compatibility across different versions of the TypeScript ESLint
 * parser. In newer versions, members are nested under a body property, while in
 * older versions they are directly on the enum node.
 *
 * @example
 *   enum Color {
 *     Red = 'RED',
 *     Green = 'GREEN',
 *     Blue = 'BLUE',
 *   }
 *   // Returns array of three TSEnumMember nodes
 *
 * @param value - TypeScript enum declaration AST node.
 * @returns Array of enum member nodes.
 */
export function getEnumMembers(
  value: TSESTree.TSEnumDeclaration,
): TSESTree.TSEnumMember[] {
  /* v8 ignore next 2 */
  // eslint-disable-next-line typescript/no-unnecessary-condition -- Handle deprecated property
  return value.body?.members ?? value.members
}
