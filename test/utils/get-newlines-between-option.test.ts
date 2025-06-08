import { describe, expect, it } from 'vitest'

import type { GetNewlinesBetweenOptionParameters } from '../../utils/get-newlines-between-option'
import type { SortingNode } from '../../types/sorting-node'

import { getNewlinesBetweenOption } from '../../utils/get-newlines-between-option'

describe('get-newlines-between-option', () => {
  describe('global "newlinesBetween" option', () => {
    it.each(['always', 'ignore', 'never'] as const)(
      'should return the global option (`%s`) if "customGroups" is not defined',
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              newlinesBetween,
            }),
          ),
        ).toBe(newlinesBetween)
      },
    )

    it.each(['always', 'ignore', 'never'] as const)(
      'should return the global option (`%s`) if "customGroups" is not an array',
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              customGroups: {},
              newlinesBetween,
            }),
          ),
        ).toBe(newlinesBetween)
      },
    )

    it.each(['ignore', 'never'] as const)(
      'should return "%s" if "newlinesBetween" is "%s"',
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              newlinesBetween,
            }),
          ),
        ).toBe(newlinesBetween)
      },
    )

    it('should return "always" if "newlinesBetween" is "always" and nodeGroupIndex !== nextNodeGroupIndex', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            groups: ['group1', 'group2'],
            newlinesBetween: 'always',
          },
          nextSortingNode: generateSortingNodeWithGroup('group1'),
          sortingNode: generateSortingNodeWithGroup('group2'),
        }),
      ).toBe('always')
    })

    it('should return "never" if "newlinesBetween" is "always" and nodeGroupIndex === nextNodeGroupIndex', () => {
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'always',
            groups: ['group1'],
          },
          nextSortingNode: generateSortingNodeWithGroup('group1'),
          sortingNode: generateSortingNodeWithGroup('group1'),
        }),
      ).toBe('never')
    })

    it.each(['always', 'ignore', 'never'] as const)(
      "should return the global option (`%s`) if the node's group is within an array",
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              customGroups: [
                {
                  groupName: 'group1',
                },
              ],
              groups: [['group1', 'group3'], 'group2'],
              newlinesBetween,
            }),
          ),
        ).toBe(newlinesBetween)
      },
    )

    it.each(['always', 'ignore', 'never'] as const)(
      "should return the global option (`%s`) if the next node's group is within an array",
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              customGroups: [
                {
                  groupName: 'group1',
                },
              ],
              groups: ['group1', ['group2', 'group3']],
              newlinesBetween,
            }),
          ),
        ).toBe(newlinesBetween)
      },
    )
  })

  describe('custom groups "newlinesBetween" option', () => {
    describe('when the node and next node belong to the same custom group', () => {
      let parameters = {
        customGroups: [
          {
            newlinesInside: 'always',
            groupName: 'group1',
          },
        ],
        nextSortingNodeGroup: 'group1',
        sortingNodeGroup: 'group1',
      } as const

      it.each(['always', 'never'] as const)(
        'should return the "newlinesInside" option (`%s`) if defined',
        newlinesInside => {
          expect(
            getNewlinesBetweenOption(
              buildParameters({
                ...parameters,
                customGroups: [
                  {
                    groupName: 'group1',
                    newlinesInside,
                  },
                ],
                newlinesBetween: 'never',
              }),
            ),
          ).toBe(newlinesInside)
        },
      )

      it.each(['ignore', 'never'] as const)(
        'should return the global option (`%s`) if the "newlinesInside" option is not defined',
        newlinesBetween => {
          expect(
            getNewlinesBetweenOption(
              buildParameters({
                ...parameters,
                customGroups: [
                  {
                    groupName: 'group1',
                  },
                ],
                newlinesBetween,
              }),
            ),
          ).toBe(newlinesBetween)
        },
      )
    })

    describe('when the node and next node do not belong to the same custom group', () => {
      it.each(['always', 'ignore', 'never'] as const)(
        'should return the global option (`%s`)',
        newlinesBetween => {
          expect(
            getNewlinesBetweenOption(
              buildParameters({
                customGroups: [
                  {
                    groupName: 'group1',
                  },
                  {
                    groupName: 'group2',
                  },
                ],
                newlinesBetween,
              }),
            ),
          ).toBe(newlinesBetween)
        },
      )
    })

    describe('newlinesBetween option between two groups', () => {
      it.each([
        { globalNewlinesBetween: 'always', newlinesBetween: 'always' },
        { globalNewlinesBetween: 'always', newlinesBetween: 'ignore' },
        { globalNewlinesBetween: 'always', newlinesBetween: 'never' },
        { globalNewlinesBetween: 'ignore', newlinesBetween: 'always' },
        { globalNewlinesBetween: 'ignore', newlinesBetween: 'ignore' },
        { globalNewlinesBetween: 'ignore', newlinesBetween: 'never' },
        { globalNewlinesBetween: 'never', newlinesBetween: 'always' },
        { globalNewlinesBetween: 'never', newlinesBetween: 'ignore' },
        { globalNewlinesBetween: 'never', newlinesBetween: 'never' },
      ] as const)(
        'should return the newlinesBetween option between two adjacent groups (%s)',
        ({ globalNewlinesBetween, newlinesBetween }) => {
          expect(
            getNewlinesBetweenOption(
              buildParameters({
                groups: ['group1', { newlinesBetween }, 'group2'],
                newlinesBetween: globalNewlinesBetween,
              }),
            ),
          ).toBe(newlinesBetween)
        },
      )

      describe('non-adjacent groups', () => {
        it.each(['always', 'ignore', 'never'] as const)(
          'should return `always` if the global option is `always`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween },
                    'group2',
                  ],
                  newlinesBetween: 'always',
                }),
              ),
            ).toBe('always')
          },
        )

        it.each(['always', 'ignore', 'never'] as const)(
          'should return `always` if `always` exists between the groups and global option is `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween: 'always' },
                    'group2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe('always')
          },
        )

        it.each(['ignore', 'never'] as const)(
          'should return `ignore` if `ignore` exists between the groups and not `always` with global option `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween: 'ignore' },
                    'group2',
                    { newlinesBetween: 'always' },
                    'someOtherGroup2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe('ignore')
          },
        )

        it.each(['always', 'ignore', 'never'] as const)(
          'should return `never` if there are only `never` between all groups and global option is `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    { newlinesBetween: 'never' },
                    'someOtherGroup',
                    { newlinesBetween: 'never' },
                    'group2',
                    'someOtherGroup2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe('never')
          },
        )

        it.each(['always', 'ignore', 'never'] as const)(
          'should return the global option (`%s`) if no `ignore` or `always` exist',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween: 'never' },
                    'group2',
                    { newlinesBetween: 'always' },
                    'someOtherGroup2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe(newlinesBetween)
          },
        )
      })
    })
  })

  let buildParameters = ({
    nextSortingNodeGroup,
    sortingNodeGroup,
    newlinesBetween,
    customGroups,
    groups,
  }: {
    newlinesBetween: GetNewlinesBetweenOptionParameters['options']['newlinesBetween']
    customGroups?: GetNewlinesBetweenOptionParameters['options']['customGroups']
    groups?: GetNewlinesBetweenOptionParameters['options']['groups']
    nextSortingNodeGroup?: string
    sortingNodeGroup?: string
  }): GetNewlinesBetweenOptionParameters => ({
    options: {
      groups: groups ?? ['group1', 'group2'],
      newlinesBetween,
      customGroups,
    },
    nextSortingNode: generateSortingNodeWithGroup(
      nextSortingNodeGroup ?? 'group2',
    ),
    sortingNode: generateSortingNodeWithGroup(sortingNodeGroup ?? 'group1'),
  })

  let generateSortingNodeWithGroup = (group: string): SortingNode =>
    ({
      group,
    }) as SortingNode
})
