import { describe, expect, it } from 'vitest'

import { validateCustomSortConfiguration } from '../../utils/validate-custom-sort-configuration'

describe('validate-custom-sort-configuration', () => {
  it.each(['alphabetical', 'line-length', 'natural'] as const)(
    'accepts empty alphabet when type is `%s`',
    type => {
      expect(() =>
        validateCustomSortConfiguration({
          alphabet: '',
          type,
        }),
      ).not.toThrow()
    },
  )

  it('throws when an empty alphabet is entered while type is `custom`', () => {
    expect(() =>
      validateCustomSortConfiguration({
        type: 'custom',
        alphabet: '',
      }),
    ).toThrow('alphabet` option must not be empty')
  })

  it('throws when an empty alphabet is entered while type is `custom` in groups', () => {
    expect(() =>
      validateCustomSortConfiguration({
        groups: [{ group: 'group', type: 'custom' }],
        type: 'alphabetical',
        alphabet: '',
      }),
    ).toThrow('alphabet` option must not be empty')
  })
})
