import { describe, expect, it } from 'vitest'

import { validateNoDuplicatedGroups } from '../../utils/validate-no-duplicated-groups'

describe('validate-no-duplicated-groups', () => {
  it('throws an error if a duplicate group is provided', () => {
    expect(() =>
      validateNoDuplicatedGroups({
        groups: [
          ['group1'],
          'group2',
          'group3',
          'group4',
          { newlinesBetween: 1 },
          'group1',
          'group2',
          { commentAbove: 'comment', group: 'group3' },
          { commentAbove: 'comment', group: ['group4'] },
        ],
      }),
    ).toThrow('Duplicated group(s): group1, group2, group3, group4')
  })
})
