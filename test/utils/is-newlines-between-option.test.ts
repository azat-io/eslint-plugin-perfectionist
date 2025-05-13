import { describe, expect, it } from 'vitest'

import { isNewlinesBetweenOption } from '../../utils/is-newlines-between-option'

describe('is-newlines-between-option', () => {
  it('should return `true` if the element is a newlines between option', () => {
    expect(
      isNewlinesBetweenOption({
        newlinesBetween: 'ignore',
      }),
    ).toBeTruthy()
  })

  it.each([
    { option: 'group' },
    { option: ['group'] },
    { option: {} },
    { option: { foo: 'bar' } },
  ])(
    'should return `false` if the element is not a newlines between option (%s)',
    ({ option }) => {
      expect(isNewlinesBetweenOption(option as unknown as string)).toBeFalsy()
    },
  )
})
