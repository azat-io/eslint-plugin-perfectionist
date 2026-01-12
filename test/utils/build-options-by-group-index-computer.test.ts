import { describe, expect, it } from 'vitest'

import type { CommonOptions } from '../../types/common-options'

import { buildOptionsByGroupIndexComputer } from '../../utils/build-options-by-group-index-computer'

describe('build-options-by-group-index-computer', () => {
  let commonOptions: CommonOptions = {
    fallbackSort: {
      type: 'unsorted',
    },
    type: 'alphabetical',
    order: 'asc',
  } as CommonOptions

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
          type: 'alphabetical',
          order: 'desc',
        },
      })
    })
  })

  describe('"type"', () => {
    it('overrides "type" with custom groups', () => {
      let groupOptions = {
        customGroups: [
          {
            groupName: 'group',
            type: 'unsorted',
          } as const,
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
        fallbackSort: {
          type: 'unsorted',
        },
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
        fallbackSort: {
          type: 'unsorted',
        },
        type: 'unsorted',
      })
    })
  })

  describe('"order"', () => {
    it('overrides "order" with custom groups', () => {
      let groupOptions = {
        customGroups: [
          {
            order: 'desc' as const,
            groupName: 'group',
          },
        ],
        groups: [{ order: 'asc' as const, group: 'group' }],
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
          type: 'unsorted',
        },
        order: 'desc',
      })
    })

    it('overrides "order" with group with overrides', () => {
      let groupOptions = {
        groups: [{ order: 'desc' as const, group: 'group' }],
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
        fallbackSort: {
          type: 'unsorted',
        },
        order: 'desc',
      })
    })
  })
})
