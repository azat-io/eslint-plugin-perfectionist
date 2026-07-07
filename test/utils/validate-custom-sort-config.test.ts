import { describe, expect, it } from 'vitest'

import { validateCustomSortConfig } from '../../utils/validate-custom-sort-config'

describe('validate-custom-sort-config', () => {
  it.each(['alphabetical', 'line-length', 'natural'] as const)(
    'accepts empty alphabet when type is `%s`',
    type => {
      expect(() =>
        validateCustomSortConfig({
          alphabet: '',
          type,
        }),
      ).not.toThrow()
    },
  )

  it('throws when an empty alphabet is entered while type is `custom`', () => {
    expect(() =>
      validateCustomSortConfig({
        type: 'custom',
        alphabet: '',
      }),
    ).toThrow('alphabet` option must not be empty')
  })

  it('throws when an empty alphabet is entered while type is `custom` in groups', () => {
    expect(() =>
      validateCustomSortConfig({
        groups: [{ group: 'group', type: 'custom' }],
        type: 'alphabetical',
        alphabet: '',
      }),
    ).toThrow('alphabet` option must not be empty')
  })
})
