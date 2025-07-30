import type { TSESTree } from '@typescript-eslint/types'

export function getEnumMembers(
  value: TSESTree.TSEnumDeclaration,
): TSESTree.TSEnumMember[] {
  /* v8 ignore next 2 */
  // eslint-disable-next-line typescript/no-unnecessary-condition -- Handle deprecated property
  return value.body?.members ?? value.members
}
