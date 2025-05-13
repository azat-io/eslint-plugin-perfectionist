import { describe, expect, it } from 'vitest'

import { isSideEffectOnlyGroup } from '../../../rules/sort-imports/is-side-effect-only-group'

describe('is-side-effect-only-group', () => {
  it('should return false if option is a newlinesBetween option', () => {
    expect(
      isSideEffectOnlyGroup({
        newlinesBetween: 'ignore',
      }),
    ).toBeFalsy()
  })

  it('should return false if option is a commentAbove option', () => {
    expect(
      isSideEffectOnlyGroup({
        commentAbove: 'foo',
      }),
    ).toBeFalsy()
  })

  it.each(['side-effect', 'side-effect-style'])(
    'should return true if option `%s`',
    group => {
      expect(isSideEffectOnlyGroup(group)).toBeTruthy()
    },
  )

  it('should return true if all elements of a subgroup is a side-effect group `%s`', () => {
    expect(
      isSideEffectOnlyGroup(['side-effect', 'side-effect-style']),
    ).toBeTruthy()
  })

  it.each(['side-effect', 'side-effect-style'])(
    'should return false if at least one element of a subgroup is not a side-effect group (`%s`)',
    group => {
      expect(isSideEffectOnlyGroup(['group1', group])).toBeFalsy()
    },
  )
})
