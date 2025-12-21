import { describe, expect, it } from 'vitest'

import type {
  NewlinesBetweenOption,
  NewlinesInsideOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../../types/common-groups-options'
import type { GetNewlinesBetweenOptionParameters } from '../../utils/get-newlines-between-option'

import { getNewlinesBetweenOption } from '../../utils/get-newlines-between-option'

const MULTIPLE_LINES_OPTIONS = [1, 2] as const

describe('get-newlines-between-option', () => {
  describe('global "newlinesBetween"/"newlinesInside" option', () => {
    it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
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

    it.each(['ignore', 0] as const)(
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

    it.each(MULTIPLE_LINES_OPTIONS)(
      'should return the entered newlinesBetween ("%s") if nodeGroupNumber !== nextNodeGroupNumber',
      newlinesBetween => {
        let groups = ['group1', 'group2']
        expect(
          getNewlinesBetweenOption({
            options: {
              newlinesInside: 'ignore',
              customGroups: [],
              newlinesBetween,
              groups,
            },
            nextNodeGroupIndex: generateNodeGroupIndex(groups, 'group2'),
            nodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
          }),
        ).toBe(newlinesBetween)
      },
    )

    it.each(MULTIPLE_LINES_OPTIONS)(
      'should return the entered newlinesInside ("%s") if nodeGroupNumber === nextNodeGroupNumber',
      newlinesInside => {
        let groups = ['group1', 'group2']
        expect(
          getNewlinesBetweenOption({
            options: {
              newlinesBetween: 'ignore',
              customGroups: [],
              newlinesInside,
              groups,
            },
            nextNodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
            nodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
          }),
        ).toBe(newlinesInside)
      },
    )

    it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
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

    it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
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

  describe('custom groups "newlinesBetween"/"newlinesInside" option', () => {
    describe('when the node and next node belong to the same custom group', () => {
      let parameters = {
        customGroups: [
          {
            groupName: 'group1',
            newlinesInside: 1,
          },
        ],
        nextNodeGroupIndexGroup: 'group1',
        sortingNodeGroup: 'group1',
      } as const

      it.each([...MULTIPLE_LINES_OPTIONS, 0] as const)(
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
                newlinesBetween: 0,
              }),
            ),
          ).toBe(newlinesInside)
        },
      )
    })

    describe('when the node and next node do not belong to the same custom group', () => {
      it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
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
      let availableOptions = [...MULTIPLE_LINES_OPTIONS, 0, 'ignore'] as const
      let availableCombinations: {
        globalNewlinesBetween: NewlinesBetweenOption
        newlinesBetween: NewlinesBetweenOption
      }[] = []
      for (let globalNewlinesBetween of availableOptions) {
        for (let newlinesBetween of availableOptions) {
          availableCombinations.push({ globalNewlinesBetween, newlinesBetween })
        }
      }
      it.each(availableCombinations)(
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
        it.each([1, 'ignore', 0] as const)(
          'should return 1 if the global option is 1 and `%s` exists between the groups',
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
                  newlinesBetween: 1,
                }),
              ),
            ).toBe(1)
          },
        )

        it.each([1, 'ignore', 0] as const)(
          'should return 1 if 1 exists between the groups and global option is `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween: 1 },
                    'group2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe(1)
          },
        )

        it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
          'should return the maximum of the newlinesBetween options if the global option is `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    { newlinesBetween: 4 },
                    'someOtherGroup',
                    { newlinesBetween: 3 },
                    'group2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe(4)
          },
        )

        it.each(['ignore', 0] as const)(
          'should return `ignore` if `ignore` exists between the groups and not 1 with global option `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween: 'ignore' },
                    'group2',
                    { newlinesBetween: 1 },
                    'someOtherGroup2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe('ignore')
          },
        )

        it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
          'should return 0 if there are only 0 between all groups and global option is `%s`',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    { newlinesBetween: 0 },
                    'someOtherGroup',
                    { newlinesBetween: 0 },
                    'group2',
                    'someOtherGroup2',
                  ],
                  newlinesBetween,
                }),
              ),
            ).toBe(0)
          },
        )

        it.each([...MULTIPLE_LINES_OPTIONS, 'ignore', 0] as const)(
          'should return the global option (`%s`) if no `ignore` or 1 exist',
          newlinesBetween => {
            expect(
              getNewlinesBetweenOption(
                buildParameters({
                  groups: [
                    'group1',
                    'someOtherGroup',
                    { newlinesBetween: 0 },
                    'group2',
                    { newlinesBetween: 1 },
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

  function buildParameters({
    nextNodeGroupIndexGroup,
    sortingNodeGroup,
    newlinesBetween,
    newlinesInside,
    customGroups,
    groups,
  }: {
    customGroups?: CustomGroupsOption<unknown, unknown, string>
    newlinesBetween: NewlinesBetweenOption
    newlinesInside?: NewlinesInsideOption
    nextNodeGroupIndexGroup?: string
    sortingNodeGroup?: string
    groups?: GroupsOptions
  }): GetNewlinesBetweenOptionParameters {
    let finalGroups = groups ?? ['group1', 'group2']
    return {
      options: {
        newlinesInside: newlinesInside ?? 'ignore',
        customGroups: customGroups ?? [],
        groups: finalGroups,
        newlinesBetween,
      },
      nextNodeGroupIndex: generateNodeGroupIndex(
        finalGroups,
        nextNodeGroupIndexGroup ?? 'group2',
      ),
      nodeGroupIndex: generateNodeGroupIndex(
        finalGroups,
        sortingNodeGroup ?? 'group1',
      ),
    }
  }

  function generateNodeGroupIndex(
    groups: GetNewlinesBetweenOptionParameters['options']['groups'],
    group: string,
  ): number {
    return groups.indexOf(group)
  }
})
