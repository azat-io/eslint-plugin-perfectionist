import type { TSESTree } from '@typescript-eslint/types'

/**
 * Retrieves enum members from a TypeScript enum declaration node.
 *
 * Handles AST shape changes in TS-ESTree `@typescript-eslint/types`:
 *
 * - Versions < 8.0.0 store enum members under `body.members`.
 * - Versions ≥ 8.0.0 expose members directly on the enum node as `members`. The
 *   fallback `body?.members` ensures backward compatibility with older parser
 *   releases.
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
