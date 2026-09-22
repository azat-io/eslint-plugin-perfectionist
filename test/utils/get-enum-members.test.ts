import type { TSESTree } from '@typescript-eslint/types'

import { describe, expect, it } from 'vitest'

import { getEnumMembers } from '../../utils/get-enum-members'

describe('get-enum-members', () => {
  it('returns members exposed directly on the enum node', () => {
    let members = [createEnumMember('Variant')]
    let enumNode = {
      members,
    } as TSESTree.TSEnumDeclaration

    expect(getEnumMembers(enumNode)).toBe(members)
  })

  it('falls back to body.members shape when members is missing', () => {
    let legacyMembers = [createEnumMember('LegacyVariant')]
    let enumNode: unknown = {
      body: { members: legacyMembers },
      members: undefined,
    }

    expect(getEnumMembers(enumNode as TSESTree.TSEnumDeclaration)).toBe(
      legacyMembers,
    )
  })

  function createEnumMember(name: string): TSESTree.TSEnumMember {
    return {
      id: {
        type: 'Identifier',
        name,
      },
      type: 'TSEnumMember',
    } as TSESTree.TSEnumMember
  }
})
