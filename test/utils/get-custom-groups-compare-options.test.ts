import { describe, expect, it } from 'vitest'

import type { CommonOptions } from '../../types/common-options'

import { getCustomGroupsCompareOptions } from '../../utils/get-custom-groups-compare-options'

describe('get-custom-groups-compare-options', () => {
  let baseOptions: Pick<CommonOptions, 'fallbackSort' | 'order' | 'type'> = {
    fallbackSort: {
      type: 'unsorted',
    },
    type: 'alphabetical',
    order: 'asc',
  }

  it('return the entered options if "customGroups" is not an array', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...baseOptions,
          groups: ['group'],
          customGroups: {},
        },
        0,
      ),
    ).toStrictEqual({
      ...baseOptions,
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

  it('overrides "fallbackSort"', () => {
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

  it('overrides "type"', () => {
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

      fallbackSort: {
        type: 'unsorted',
      },
      type: 'unsorted',
    })
  })

  it('overrides "order"', () => {
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
          groups: ['group'],
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
