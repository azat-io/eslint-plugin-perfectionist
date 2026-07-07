import { describe, expect, it } from 'vitest'

import { validateSideEffectsConfig } from '../../../rules/sort-imports/validate-side-effects-config'

describe('validate-side-effects-config', () => {
  it.each([
    { groups: [['side-effect', 'sibling']] },
    { groups: [{ group: ['side-effect', 'sibling'] }] },
  ])('should not throw an error when sortSideEffects is true', ({ groups }) => {
    expect(() => {
      validateSideEffectsConfig({
        sortSideEffects: true,
        groups,
      })
    }).not.toThrow()
  })

  it.each([
    { groups: ['builtin', ['internal', 'object'], ['side-effect', 'sibling']] },
    {
      groups: [
        'builtin',
        ['internal', 'object'],
        { group: ['side-effect', 'sibling'] },
      ],
    },
  ])(
    'should throw if `groups` contain a subgroup containing a side-effect group and a non-side effect group',
    ({ groups }) => {
      expect(() => {
        validateSideEffectsConfig({
          sortSideEffects: false,
          groups,
        })
      }).toThrow(
        "Side effect groups cannot be nested with non side effect groups when 'sortSideEffects' is 'false'",
      )
    },
  )
})
