import { describe, expect, it } from 'vitest'

import { isStringGroupSideEffectOnlyGroup } from '../../../rules/sort-imports/is-string-group-side-effect-only-group'

describe('is-string-group-side-effect-only-group', () => {
  it.each(['side-effect', 'side-effect-style'])(
    "should return true if groupName is '%s'",
    groupName => {
      expect(isStringGroupSideEffectOnlyGroup(groupName)).toBe(true)
    },
  )

  it('should return false otherwise', () => {
    expect(isStringGroupSideEffectOnlyGroup('other-group')).toBe(false)
  })
})
