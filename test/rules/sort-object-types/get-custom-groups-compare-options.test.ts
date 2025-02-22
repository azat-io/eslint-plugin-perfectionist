import { describe, expect, it } from 'vitest'

import type { Options } from '../../../rules/sort-object-types/types'
import type { GroupsOptions } from '../../../types/common-options'

import { getCustomGroupsCompareOptions } from '../../../rules/sort-object-types/get-custom-groups-compare-options'

describe('get-custom-groups-compare-options', () => {
  let commonOptions: Pick<
    Required<Options[0]>,
    'fallbackSort' | 'sortBy' | 'order' | 'type'
  > & {
    groups: GroupsOptions<string>
  } = {
    fallbackSort: {
      type: 'unsorted',
      sortBy: 'name',
    },
    type: 'alphabetical',
    groups: ['group'],
    sortBy: 'name',
    order: 'asc',
  }

  it('return the entered options if "customGroups" is not an array', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...commonOptions,
          customGroups: {},
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        fallbackSort: {
          type: 'unsorted',
          sortBy: 'name',
        },
        type: 'alphabetical',
        sortBy: 'name',
        order: 'asc',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })

  it('return the entered options if the group is not linked to a custom group', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...commonOptions,
          customGroups: [],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        fallbackSort: {
          type: 'unsorted',
          sortBy: 'name',
        },
        type: 'alphabetical',
        sortBy: 'name',
        order: 'asc',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })

  it('overrides "fallbackSort"', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...commonOptions,
          customGroups: [
            {
              fallbackSort: {
                type: 'unsorted',
              },
              groupName: 'group',
            },
          ],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        fallbackSort: {
          type: 'unsorted',
        },
        type: 'alphabetical',
        sortBy: 'name',
        order: 'asc',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })

  it('overrides "type"', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...commonOptions,
          customGroups: [
            {
              groupName: 'group',
              type: 'unsorted',
            },
          ],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        fallbackSort: {
          type: 'unsorted',
        },
        type: 'unsorted',
        sortBy: 'name',
        order: 'asc',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })

  it('overrides "order"', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...commonOptions,
          customGroups: [
            {
              groupName: 'group',
              order: 'desc',
            },
          ],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        fallbackSort: {
          type: 'unsorted',
        },
        type: 'alphabetical',
        sortBy: 'name',
        order: 'desc',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })
})
