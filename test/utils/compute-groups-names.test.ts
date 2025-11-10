import { describe, expect, it } from 'vitest'

import { computeGroupsNames } from '../../utils/compute-groups-names'

describe('computeGroupsNames', () => {
  it("should return the groups if it's an array", () => {
    expect(computeGroupsNames([['foo', 'bar']])).toStrictEqual(['foo', 'bar'])
  })

  it('should return an array with the group if the group is a string', () => {
    expect(computeGroupsNames(['foo'])).toStrictEqual(['foo'])
  })

  describe('when the group is a comment above object', () => {
    it('should return an array with the group if the group is a string', () => {
      expect(
        computeGroupsNames([{ commentAbove: 'foo', group: 'foo' }]),
      ).toStrictEqual(['foo'])
    })

    it("should return the groups if it's an array", () => {
      expect(
        computeGroupsNames([{ group: ['foo', 'bar'], commentAbove: 'foo' }]),
      ).toStrictEqual(['foo', 'bar'])
    })
  })

  it('should return an empty array if the group is a newlinesBetween object', () => {
    expect(computeGroupsNames([{ newlinesBetween: 1 }])).toStrictEqual([])
  })

  it('should concatenate results', () => {
    expect(
      computeGroupsNames([
        ['a', 'b'],
        'c',
        { commentAbove: 'd', group: 'd' },
        { commentAbove: 'e', group: ['e', 'f'] },
      ]),
    ).toStrictEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })
})
