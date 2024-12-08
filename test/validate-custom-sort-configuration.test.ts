import { describe, expect, it } from 'vitest'

import { validateCustomSortConfiguration } from '../utils/validate-custom-sort-configuration'

describe('validate-custom-sort-configuration', () => {
  it('accepts empty alphabet when type is not `custom`', () => {
    for (let type of ['alphabetical', 'line-length', 'natural'] as const) {
      expect(() =>
        validateCustomSortConfiguration({
          alphabet: '',
          type,
        }),
      ).not.toThrow()
    }
  })

  it('throws when an empty alphabet is entered while type is `custom`', () => {
    expect(() =>
      validateCustomSortConfiguration({
        type: 'custom',
        alphabet: '',
      }),
    ).toThrow('alphabet` option must not be empty')
  })
})
