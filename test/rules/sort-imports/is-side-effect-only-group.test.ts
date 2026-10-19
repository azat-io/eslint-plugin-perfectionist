import { describe, expect, it } from 'vitest'

import { isSideEffectOnlyGroup } from '../../../rules/sort-imports/is-side-effect-only-group'

describe('is-side-effect-only-group', () => {
  it('should return false if option is undefined', () => {
    expect(isSideEffectOnlyGroup(undefined)).toBe(false)
  })

  it('should return false if option is a newlinesBetween option', () => {
    expect(
      isSideEffectOnlyGroup({
        newlinesBetween: 'ignore',
      }),
    ).toBe(false)
  })

  it.each(['side-effect', 'side-effect-style'])(
    'should return true if option `%s`',
    group => {
      expect(isSideEffectOnlyGroup(group)).toBe(true)
    },
  )

  it('should return true if all elements of a subgroup is a side-effect group `%s`', () => {
    expect(isSideEffectOnlyGroup(['side-effect', 'side-effect-style'])).toBe(
      true,
    )
  })

  it.each(['side-effect', 'side-effect-style'])(
    'should return false if at least one element of a subgroup is not a side-effect group (`%s`)',
    group => {
      expect(isSideEffectOnlyGroup(['group1', group])).toBe(false)
    },
  )

  it.each(['side-effect', 'side-effect-style'])(
    'should return true if object-based option has group `%s`',
    group => {
      expect(
        isSideEffectOnlyGroup({
          commentAbove: 'foo',
          group,
        }),
      ).toBe(true)
    },
  )

  it('should return true if object-based option has all elements of group is a side-effect group', () => {
    expect(
      isSideEffectOnlyGroup({
        group: ['side-effect', 'side-effect-style'],
        commentAbove: 'foo',
      }),
    ).toBe(true)
  })

  it.each(['side-effect', 'side-effect-style'])(
    'should return false if object-based option has at least one element of a subgroup that is not a side-effect group (`%s`)',
    group => {
      expect(
        isSideEffectOnlyGroup({
          group: ['group1', group],
          commentAbove: 'foo',
        }),
      ).toBe(false)
    },
  )
})
