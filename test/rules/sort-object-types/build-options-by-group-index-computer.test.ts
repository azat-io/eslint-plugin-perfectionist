import { describe, expect, it } from 'vitest'

import type { Options } from '../../../rules/sort-object-types/types'

import { buildOptionsByGroupIndexComputer } from '../../../rules/sort-object-types/build-options-by-group-index-computer'

describe('build-options-by-group-index-computer', () => {
  let commonOptions: Required<Options[number]> = {
    fallbackSort: {
      type: 'unsorted',
      sortBy: 'name',
    },
    type: 'alphabetical',
    sortBy: 'name',
    order: 'asc',
  } as Required<Options[number]>

  it('matches string groups', () => {
    let groupOptions = {
      customGroups: [
        {
          type: 'unsorted' as const,
          groupName: 'group',
        },
      ],
      groups: ['group'],
    }
    expect(
      buildOptionsByGroupIndexComputer({
        ...commonOptions,
        ...groupOptions,
      })(0),
    ).toStrictEqual({
      ...commonOptions,
      ...groupOptions,
      type: 'unsorted',
    })
  })

  it('ignores array sub groups', () => {
    let groupOptions = {
      customGroups: [
        {
          type: 'unsorted' as const,
          groupName: 'group',
        },
      ],
      groups: [['group']],
    }
    expect(
      buildOptionsByGroupIndexComputer({
        ...commonOptions,
        ...groupOptions,
      })(0),
    ).toStrictEqual({
      ...commonOptions,
      ...groupOptions,
      type: 'alphabetical',
    })
  })

  describe('commentAbove groups', () => {
    it('matches string groups', () => {
      let groupOptions = {
        customGroups: [
          {
            type: 'unsorted' as const,
            groupName: 'group',
          },
        ],
        groups: [{ commentAbove: 'foo', group: 'group' }],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        type: 'unsorted',
      })
    })

    it('ignores array sub groups', () => {
      let groupOptions = {
        customGroups: [
          {
            type: 'unsorted' as const,
            groupName: 'group',
          },
        ],
        groups: [{ commentAbove: 'foo', group: ['group'] }],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
          customGroups: [
            {
              groupName: 'group',
              type: 'unsorted',
            },
          ],
          groups: [{ commentAbove: 'foo', group: ['group'] }],
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        type: 'alphabetical',
      })
    })
  })

  it('return the entered options if the group is not linked to a custom group', () => {
    let groupOptions = {
      groups: ['group'],
      customGroups: [],
    }
    expect(
      buildOptionsByGroupIndexComputer({
        ...commonOptions,
        ...groupOptions,
        groups: ['group'],
        customGroups: [],
      })(0),
    ).toStrictEqual({
      ...commonOptions,
      ...groupOptions,
    })
  })

  describe('"fallbackSort"', () => {
    it('overrides "fallbackSort.type"', () => {
      let groupOptions = {
        customGroups: [
          {
            fallbackSort: {
              type: 'unsorted' as const,
            },
            groupName: 'group',
          },
        ],
        groups: ['group'],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        fallbackSort: {
          ...commonOptions.fallbackSort,
          type: 'unsorted',
        },
      })
    })

    it('overrides "fallbackSort.order"', () => {
      let groupOptions = {
        customGroups: [
          {
            fallbackSort: {
              type: 'alphabetical',
              order: 'desc',
            } as const,
            groupName: 'group',
          },
        ],
        groups: ['group'],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        fallbackSort: {
          ...commonOptions.fallbackSort,
          type: 'alphabetical',
          order: 'desc',
        },
      })
    })

    it('overrides "fallbackSort.sortBy"', () => {
      let groupOptions = {
        customGroups: [
          {
            fallbackSort: {
              type: 'alphabetical',
              sortBy: 'value',
            } as const,
            groupName: 'group',
          },
        ],
        groups: ['group'],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        fallbackSort: {
          type: 'alphabetical',
          sortBy: 'value',
        },
      })
    })
  })

  describe('"type"', () => {
    it('overrides "type" with custom groups', () => {
      let groupOptions = {
        customGroups: [
          {
            type: 'unsorted' as const,
            groupName: 'group',
          },
        ],
        groups: [{ type: 'natural' as const, group: 'group' }],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        type: 'unsorted',
      })
    })

    it('overrides "type" with group with overrides', () => {
      let groupOptions = {
        groups: [{ type: 'unsorted' as const, group: 'group' }],
        customGroups: [],
      }
      expect(
        buildOptionsByGroupIndexComputer({
          ...commonOptions,
          ...groupOptions,
        })(0),
      ).toStrictEqual({
        ...commonOptions,
        ...groupOptions,
        type: 'unsorted',
      })
    })
  })

  it('overrides "order"', () => {
    let groupOptions = {
      customGroups: [
        {
          order: 'desc' as const,
          groupName: 'group',
        },
      ],
      groups: ['group'],
    }
    expect(
      buildOptionsByGroupIndexComputer({
        ...commonOptions,
        ...groupOptions,
      })(0),
    ).toStrictEqual({
      ...commonOptions,
      ...groupOptions,
      order: 'desc',
    })
  })
})
