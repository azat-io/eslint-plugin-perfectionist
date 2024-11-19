import type { TSESTree } from '@typescript-eslint/types'

export let getEnumMembers = (
  value: TSESTree.TSEnumDeclaration,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Handle deprecated property
): TSESTree.TSEnumMember[] => value.body?.members ?? value.members
