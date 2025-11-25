import { describe, expect, it } from 'vitest'

import type { CommonOptions } from '../../types/common-options'

import { getCustomGroupsCompareOptions } from '../../utils/build-default-options-by-group-index-computer'

describe('get-custom-groups-compare-options', () => {
  let baseOptions: Pick<CommonOptions, 'fallbackSort' | 'order' | 'type'> = {
    fallbackSort: {
      type: 'unsorted',
    },
    type: 'alphabetical',
    order: 'asc',
  }

  it('matches string groups', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...baseOptions,
          customGroups: [
            {
              groupName: 'group',
              type: 'unsorted',
            },
          ],
          groups: ['group'],
        },
        0,
      ),
    ).toStrictEqual({
      ...baseOptions,
      type: 'unsorted',
    })
  })

  it('ignores array sub groups', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...baseOptions,
          customGroups: [
            {
              groupName: 'group',
              type: 'unsorted',
            },
          ],
          groups: [['group']],
        },
        0,
      ),
    ).toStrictEqual({
      ...baseOptions,
      type: 'alphabetical',
    })
  })

  describe('commentAbove groups', () => {
    it('matches string groups', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                groupName: 'group',
                type: 'unsorted',
              },
            ],
            groups: [{ commentAbove: 'foo', group: 'group' }],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        type: 'unsorted',
      })
    })

    it('ignores array sub groups', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                groupName: 'group',
                type: 'unsorted',
              },
            ],
            groups: [{ commentAbove: 'foo', group: ['group'] }],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        type: 'alphabetical',
      })
    })
  })

  it('return the entered options if the group is not linked to a custom group', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...baseOptions,
          groups: ['group'],
          customGroups: [],
        },
        0,
      ),
    ).toStrictEqual({
      ...baseOptions,
    })
  })

  describe('"fallbackSort"', () => {
    it('overrides "fallbackSort.type"', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                fallbackSort: {
                  type: 'unsorted',
                },
                groupName: 'group',
              },
            ],
            groups: ['group'],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'unsorted',
        },
      })
    })

    it('takes "fallbackSort.order" if the custom group does not override it', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                },
                groupName: 'group',
              },
            ],
            fallbackSort: {
              type: 'natural',
              order: 'desc',
            },
            groups: ['group'],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'alphabetical',
          order: 'desc',
        },
      })
    })

    it('overrides "fallbackSort.order" with custom groups', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  order: 'desc',
                },
                groupName: 'group',
              },
            ],
            groups: ['group'],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'alphabetical',
          order: 'desc',
        },
      })
    })
  })

  describe('"type"', () => {
    it('overrides "type" with custom groups', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                groupName: 'group',
                type: 'unsorted',
              },
            ],
            groups: [{ type: 'natural', group: 'group' }],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'unsorted',
        },
        type: 'unsorted',
      })
    })

    it('overrides "type" with group with overrides', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            groups: [{ type: 'unsorted', group: 'group' }],
            customGroups: [],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'unsorted',
        },
        type: 'unsorted',
      })
    })
  })

  describe('"order"', () => {
    it('overrides "order" with custom groups', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            customGroups: [
              {
                groupName: 'group',
                order: 'desc',
              },
            ],
            groups: [{ group: 'group', order: 'asc' }],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'unsorted',
        },
        order: 'desc',
      })
    })

    it('overrides "order" with group with overrides', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...baseOptions,
            groups: [{ group: 'group', order: 'desc' }],
            customGroups: [],
          },
          0,
        ),
      ).toStrictEqual({
        ...baseOptions,
        fallbackSort: {
          type: 'unsorted',
        },
        order: 'desc',
      })
    })
  })
})
