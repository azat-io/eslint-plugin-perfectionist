import { describe, expect, it } from 'vitest'

import { computeGroup } from '../../utils/compute-group'

describe('computeGroup', () => {
  it('should return "unknown" if no group matches', () => {
    expect(
      computeGroup({
        options: {
          groups: ['group2'],
        },
        predefinedGroups: ['group1'],
      }),
    ).toBe('unknown')
  })

  it('should return the first predefined group encountered that exists in `options.groups`', () => {
    expect(
      computeGroup({
        options: {
          groups: ['group1', 'group2'],
        },
        predefinedGroups: ['group2', 'group1'],
      }),
    ).toBe('group2')
  })

  it('should iterate on each array element of a `options.groups`', () => {
    expect(
      computeGroup({
        options: {
          groups: ['group1', ['group2', 'group3'], 'group4'],
        },
        predefinedGroups: ['group3', 'group4'],
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

  describe('deprecated custom groups', () => {
    it('should take priority over predefined groups', () => {
      expect(
        computeGroup({
          options: {
            customGroups: {
              group2: 'name',
            },
            groups: ['group1', 'group2'],
          },
          predefinedGroups: ['group1'],
          name: 'name',
        }),
      ).toBe('group2')
    })

    it('should return the first matching custom group encountered that exists in `options.groups`', () => {
      expect(
        computeGroup({
          options: {
            customGroups: {
              group1: 'name',
              group2: 'name',
            },
            groups: ['group2', 'group1'],
          },
          predefinedGroups: [],
          name: 'name',
        }),
      ).toBe('group1')
    })
  })
})
