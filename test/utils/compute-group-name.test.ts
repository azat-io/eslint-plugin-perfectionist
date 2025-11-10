import { describe, expect, it } from 'vitest'

import { computeGroupName } from '../../utils/compute-group-name'

describe('computeGroupName', () => {
  it("should return the group if it's a string", () => {
    expect(computeGroupName('foo')).toBe('foo')
  })

  it('should return null if the group is an array', () => {
    expect(computeGroupName(['foo'])).toBeNull()
  })

  describe('when the group is a comment above object', () => {
    it("should return the group if it's a string", () => {
      expect(computeGroupName({ commentAbove: 'foo', group: 'foo' })).toBe(
        'foo',
      )
    })

    it('should return null if the group is an array', () => {
      expect(
        computeGroupName({ group: ['foo', 'bar'], commentAbove: 'foo' }),
      ).toBeNull()
    })
  })

  it('should return null if the group is a newlinesBetween object', () => {
    expect(computeGroupName({ newlinesBetween: 1 })).toBeNull()
  })
})
