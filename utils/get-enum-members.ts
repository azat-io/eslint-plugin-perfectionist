import type { TSESTree } from '@typescript-eslint/types'

/**
 * Retrieves enum members from a TypeScript enum declaration node.
 *
 * Handles AST shape changes in TS-ESTree `@typescript-eslint/types`:
 *
 * - Newer parser versions wrap enum members in `body.members` and deprecate
 *   `members` on the enum node.
 * - Older parser versions expose members directly on the enum node as `members`.
 *   The fallback keeps backward compatibility with older parser releases.
 *
 * @example
 *
 * ```ts
 * enum Color {
 *   Red = 'RED',
 *   Green = 'GREEN',
 *   Blue = 'BLUE',
 * }
 * // Returns array of three TSEnumMember nodes
 * ```
 *
 * @param value - TypeScript enum declaration AST node.
 * @returns Array of enum member nodes.
 */
export function getEnumMembers(
  value: TSESTree.TSEnumDeclaration,
): TSESTree.TSEnumMember[] {
  return (
    // eslint-disable-next-line typescript/no-unnecessary-condition -- Handle deprecated property
    value.body?.members ?? value.members
  )
}
