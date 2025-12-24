import { describe, expect, it } from 'vitest'

import { computeGroup } from '../../utils/compute-group'

describe('computeGroup', () => {
  it('should return "unknown" if no group matches', () => {
    expect(
      computeGroup({
        options: {
          groups: ['group2'],
          customGroups: [],
        },
        customGroupMatcher: () => false,
        predefinedGroups: ['group1'],
      }),
    ).toBe('unknown')
  })

  it('should iterate on each string group encountered in `options.groups`', () => {
    expect(
      computeGroup({
        options: {
          groups: ['group1', 'group2'],
          customGroups: [],
        },
        predefinedGroups: ['group2', 'group1'],
        customGroupMatcher: () => false,
      }),
    ).toBe('group2')
  })

  it('should iterate on each array element of a `options.groups`', () => {
    expect(
      computeGroup({
        options: {
          groups: ['group1', ['group2', 'group3'], 'group4'],
          customGroups: [],
        },
        predefinedGroups: ['group3', 'group4'],
        customGroupMatcher: () => false,
      }),
    ).toBe('group3')
  })

  it('should iterate on each string group encountered in a object-based group', () => {
    expect(
      computeGroup({
        options: {
          groups: [
            'group1',
            ['group2'],
            { commentAbove: 'foo', group: 'group3' },
            'group4',
          ],
          customGroups: [],
        },
        predefinedGroups: ['group3', 'group4'],
        customGroupMatcher: () => false,
      }),
    ).toBe('group3')
  })

  it('should iterate on each array group encountered in a object-based group', () => {
    expect(
      computeGroup({
        options: {
          groups: [
            'group1',
            { group: ['group2', 'group3'], commentAbove: 'foo' },
            'group4',
          ],
          customGroups: [],
        },
        predefinedGroups: ['group3', 'group4'],
        customGroupMatcher: () => false,
      }),
    ).toBe('group3')
  })

  describe('custom groups', () => {
    it('should take priority over predefined groups', () => {
      expect(
        computeGroup({
          options: {
            customGroups: [
              {
                groupName: 'group2',
              },
            ],
            groups: ['group1', 'group2'],
          },
          customGroupMatcher: () => true,
          predefinedGroups: ['group1'],
        }),
      ).toBe('group2')
    })

    it('should return the first matching custom group encountered that exists in `options.groups`', () => {
      expect(
        computeGroup({
          options: {
            customGroups: [
              {
                groupName: 'group2',
              },
              {
                groupName: 'group1',
              },
            ],
            groups: ['group1', 'group2'],
          },
          customGroupMatcher: () => true,
          predefinedGroups: [],
        }),
      ).toBe('group2')
    })
  })
})
