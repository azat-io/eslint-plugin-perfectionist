import { describe, expect, it } from 'vitest'

import type {
  CustomGroupsOption,
  GroupsOptions,
} from '../../types/common-groups-options'

import { GroupMatcher } from '../../utils/group-matcher'

let allSelectors = ['get-method', 'method', 'property'] as const
let allModifiers = ['static', 'async', 'public'] as const

type Selector = (typeof allSelectors)[number]
type Modifier = (typeof allModifiers)[number]

describe('group-matcher', () => {
  describe('custom groups', () => {
    it('takes priority over predefined groups', () => {
      expect(
        computeGroup({
          customGroups: [{ groupName: 'custom' }],
          customGroupMatcher: () => true,
          groups: ['method', 'custom'],
          selectors: ['method'],
        }),
      ).toBe('custom')
    })

    it('returns the first matching custom group', () => {
      expect(
        computeGroup({
          customGroups: [{ groupName: 'custom2' }, { groupName: 'custom1' }],
          groups: ['custom1', 'custom2'],
          customGroupMatcher: () => true,
          selectors: ['method'],
        }),
      ).toBe('custom2')
    })

    it('ignores custom groups missing from `groups`', () => {
      expect(
        computeGroup({
          customGroups: [{ groupName: 'custom1' }, { groupName: 'custom2' }],
          customGroupMatcher: () => true,
          selectors: ['method'],
          groups: ['custom2'],
        }),
      ).toBe('custom2')
    })

    it('ignores custom groups that do not match', () => {
      expect(
        computeGroup({
          customGroupMatcher: customGroup => customGroup.groupName === 'b',
          customGroups: [{ groupName: 'a' }, { groupName: 'b' }],
          selectors: ['method'],
          groups: ['a', 'b'],
        }),
      ).toBe('b')
    })
  })

  describe('predefined groups', () => {
    it('returns "unknown" if no group matches', () => {
      expect(
        computeGroup({
          selectors: ['method'],
          groups: ['property'],
        }),
      ).toBe('unknown')
    })

    it('prioritizes selectors listed first in `allSelectors`', () => {
      expect(
        computeGroup({
          selectors: ['get-method', 'method'],
          groups: ['method', 'get-method'],
        }),
      ).toBe('get-method')
    })

    it('prioritizes groups with more modifiers', () => {
      expect(
        computeGroup({
          groups: ['static-method', 'static-async-method'],
          modifiers: ['static', 'async'],
          selectors: ['method'],
        }),
      ).toBe('static-async-method')
    })

    it('prioritizes modifiers listed first in `allModifiers`', () => {
      expect(
        computeGroup({
          groups: ['async-method', 'static-method'],
          modifiers: ['async', 'static'],
          selectors: ['method'],
        }),
      ).toBe('static-method')
    })

    it('requires every modifier of the group', () => {
      expect(
        computeGroup({
          groups: ['static-async-method', 'method'],
          modifiers: ['static'],
          selectors: ['method'],
        }),
      ).toBe('method')
    })

    it('parses selectors containing dashes', () => {
      expect(
        computeGroup({
          groups: ['static-method', 'static-get-method'],
          selectors: ['get-method'],
          modifiers: ['static'],
        }),
      ).toBe('static-get-method')
    })

    it('ignores group names without a known selector', () => {
      expect(
        computeGroup({
          groups: ['static', 'method'],
          modifiers: ['static'],
          selectors: ['method'],
        }),
      ).toBe('method')
    })

    it('keeps the first of two groups with the same modifiers', () => {
      expect(
        computeGroup({
          groups: ['async-static-method', 'static-async-method'],
          modifiers: ['static', 'async'],
          selectors: ['method'],
        }),
      ).toBe('async-static-method')
    })

    it('reads group names from arrays and group objects', () => {
      expect(
        computeGroup({
          groups: [
            ['property'],
            { newlinesBetween: 1 },
            { group: ['static-method'], commentAbove: 'Static' },
          ],
          modifiers: ['static'],
          selectors: ['method'],
        }),
      ).toBe('static-method')
    })
  })
})

function computeGroup({
  customGroupMatcher = () => false,
  customGroups = [],
  modifiers = [],
  selectors,
  groups,
}: {
  customGroupMatcher?(
    customGroup: CustomGroupsOption<string, object, unknown>[number],
  ): boolean
  customGroups?: CustomGroupsOption<string, object, unknown>
  modifiers?: Modifier[]
  selectors: Selector[]
  groups: GroupsOptions
}): string {
  let groupMatcher = new GroupMatcher({
    options: {
      customGroups,
      groups,
    },
    allModifiers,
    allSelectors,
  })

  return groupMatcher.computeGroup({
    customGroupMatcher,
    selectors,
    modifiers,
  })
}
