import { describe, expect, it } from 'vitest'

import { isGroupWithOverridesOption } from '../../utils/is-group-with-overrides-option'

describe('is-group-with-overrides-option', () => {
  it.each([{ group: 'group' }, { group: ['group'] }])(
    'should return `true` if the element is a group with overrides option (%s)',
    (option: { group: string[] | string }) => {
      expect(isGroupWithOverridesOption(option)).toBeTruthy()
    },
  )

  it.each(['group', ['group'], {}, { foo: 'bar' }, { newlinesBetween: 1 }])(
    'should return `false` if the element is not a group with overrides option (%s)',
    option => {
      expect(
        isGroupWithOverridesOption(option as unknown as string),
      ).toBeFalsy()
    },
  )
})
