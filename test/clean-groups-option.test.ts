import { describe, expect, it } from 'vitest'

import { cleanGroupsOption } from '../utils/clean-groups-option'

describe('clean-groups-option', () => {
  it('cleans the groups option', () => {
    expect(
      cleanGroupsOption({
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
