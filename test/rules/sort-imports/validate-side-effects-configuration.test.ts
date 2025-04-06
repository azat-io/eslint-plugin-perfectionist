import { describe, expect, it } from 'vitest'

import { validateSideEffectsConfiguration } from '../../../rules/sort-imports/validate-side-effects-configuration'

describe('validate-side-effects-configuration', () => {
  it('should not throw an error when sortSideEffects is true', () => {
    expect(() => {
      validateSideEffectsConfiguration({
        groups: [['side-effect', 'sibling']],
        sortSideEffects: true,
      })
    }).not.toThrow()
  })

  it('should throw if `groups` contain a subgroup containing a side-effect group and a non-side effect group', () => {
    expect(() => {
      validateSideEffectsConfiguration({
        groups: ['builtin', ['internal', 'object'], ['side-effect', 'sibling']],
        sortSideEffects: false,
      })
    }).toThrow(
      "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'",
    )
  })
})
