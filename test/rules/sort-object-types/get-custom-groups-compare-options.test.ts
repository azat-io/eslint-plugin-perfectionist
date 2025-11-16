import { describe, expect, it } from 'vitest'

import type { Options } from '../../../rules/sort-object-types/types'

import { getCustomGroupsCompareOptions } from '../../../rules/sort-object-types/get-custom-groups-compare-options'

describe('get-custom-groups-compare-options', () => {
  let commonOptions: Pick<
    Required<Options[number]>,
    'fallbackSort' | 'sortBy' | 'order' | 'type'
  > = {
    fallbackSort: {
      type: 'unsorted',
      sortBy: 'name',
    },
    type: 'alphabetical',
    sortBy: 'name',
    order: 'asc',
  }

  it('matches string groups', () => {
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
          groups: ['group'],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        ...commonOptions,
        type: 'unsorted',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })

  it('ignores array sub groups', () => {
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
          groups: [['group']],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        ...commonOptions,
        type: 'alphabetical',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })

  describe('commentAbove groups', () => {
    it('matches string groups', () => {
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
            groups: [{ commentAbove: 'foo', group: 'group' }],
          },
          0,
        ),
      ).toStrictEqual({
        options: {
          ...commonOptions,
          type: 'unsorted',
        },
        fallbackSortNodeValueGetter: null,
        nodeValueGetter: null,
      })
    })

    it('ignores array sub groups', () => {
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
            groups: [{ commentAbove: 'foo', group: ['group'] }],
          },
          0,
        ),
      ).toStrictEqual({
        options: {
          ...commonOptions,
          type: 'alphabetical',
        },
        fallbackSortNodeValueGetter: null,
        nodeValueGetter: null,
      })
    })
  })

  it('return the entered options if the group is not linked to a custom group', () => {
    expect(
      getCustomGroupsCompareOptions(
        {
          ...commonOptions,
          groups: ['group'],
          customGroups: [],
        },
        0,
      ),
    ).toStrictEqual({
      fallbackSortNodeValueGetter: null,
      options: commonOptions,
      nodeValueGetter: null,
    })
  })

  describe('"fallbackSort"', () => {
    it('overrides "fallbackSort.type"', () => {
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
            groups: ['group'],
          },
          0,
        ),
      ).toStrictEqual({
        options: {
          ...commonOptions,
          fallbackSort: {
            ...commonOptions.fallbackSort,
            type: 'unsorted',
          },
        },
        fallbackSortNodeValueGetter: null,
        nodeValueGetter: null,
      })
    })

    it('overrides "fallbackSort.order"', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...commonOptions,
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
        options: {
          ...commonOptions,
          fallbackSort: {
            ...commonOptions.fallbackSort,
            type: 'alphabetical',
            order: 'desc',
          },
        },
        fallbackSortNodeValueGetter: null,
        nodeValueGetter: null,
      })
    })

    it('overrides "fallbackSort.sortBy"', () => {
      expect(
        getCustomGroupsCompareOptions(
          {
            ...commonOptions,
            customGroups: [
              {
                fallbackSort: {
                  type: 'alphabetical',
                  sortBy: 'value',
                },
                groupName: 'group',
              },
            ],
            groups: ['group'],
          },
          0,
        ),
      ).toStrictEqual({
        options: {
          ...commonOptions,
          fallbackSort: {
            type: 'alphabetical',
            sortBy: 'value',
          },
        },
        fallbackSortNodeValueGetter: expect.any(Function),
        nodeValueGetter: null,
      })
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
          groups: ['group'],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        ...commonOptions,
        type: 'unsorted',
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
          groups: ['group'],
        },
        0,
      ),
    ).toStrictEqual({
      options: {
        ...commonOptions,
        order: 'desc',
      },
      fallbackSortNodeValueGetter: null,
      nodeValueGetter: null,
    })
  })
})
