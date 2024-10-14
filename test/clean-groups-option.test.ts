import { describe, expect, it } from 'vitest'

import { getOptionsWithCleanGroups } from '../utils/get-options-with-clean-groups'

describe('get-options-with-cleaned-groups', () => {
  it('get options with cleaned groups', () => {
    expect(
      getOptionsWithCleanGroups({
        groups: [
          'predefinedGroup',
          [],
          ['customGroup', 'group1'],
          ['singleGroup'],
          'group2',
        ],
      }),
    ).toStrictEqual({
      groups: [
        'predefinedGroup',
        ['customGroup', 'group1'],
        'singleGroup',
        'group2',
      ],
    })
  })
})
