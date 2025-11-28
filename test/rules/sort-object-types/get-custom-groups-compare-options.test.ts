import { describe, expect, it } from 'vitest'

import type { Options } from '../../../rules/sort-object-types/types'

import { computeOverriddenOptionsByGroupIndex } from '../../../rules/sort-object-types/compute-overridden-options-by-group-index'

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
      computeOverriddenOptionsByGroupIndex(
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
      computeOverriddenOptionsByGroupIndex(
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
        computeOverriddenOptionsByGroupIndex(
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
        computeOverriddenOptionsByGroupIndex(
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
      computeOverriddenOptionsByGroupIndex(
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
        computeOverriddenOptionsByGroupIndex(
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
        computeOverriddenOptionsByGroupIndex(
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
        computeOverriddenOptionsByGroupIndex(
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

  describe('"type"', () => {
    it('overrides "type" with custom groups', () => {
      expect(
        computeOverriddenOptionsByGroupIndex(
          {
            ...commonOptions,
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
        options: {
          ...commonOptions,
          type: 'unsorted',
        },
        fallbackSortNodeValueGetter: null,
        nodeValueGetter: null,
      })
    })

    it('overrides "type" with group with overrides', () => {
      expect(
        computeOverriddenOptionsByGroupIndex(
          {
            ...commonOptions,
            groups: [{ type: 'unsorted', group: 'group' }],
            customGroups: [],
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
  })

  it('overrides "order"', () => {
    expect(
      computeOverriddenOptionsByGroupIndex(
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
