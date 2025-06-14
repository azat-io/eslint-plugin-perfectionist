import { describe, expect, it } from 'vitest'

import type { GetNewlinesBetweenOptionParameters } from '../../utils/get-newlines-between-option'
import type { NewlinesBetweenOption } from '../../types/common-options'

import { getNewlinesBetweenOption } from '../../utils/get-newlines-between-option'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'

const NEVER_OPTIONS = [0, 'never'] as const
const ALWAYS_OPTIONS = [1, 2, 'always'] as const

describe('get-newlines-between-option', () => {
  describe('global "newlinesBetween" option', () => {
    it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
      'should return the global option (`%s`) if "customGroups" is not defined',
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              newlinesBetween,
            }),
          ),
        ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
      },
    )

    it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
      'should return the global option (`%s`) if "customGroups" is not an array',
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              customGroups: {},
              newlinesBetween,
            }),
          ),
        ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
      },
    )

    it.each(['ignore', ...NEVER_OPTIONS] as const)(
      'should return "%s" if "newlinesBetween" is "%s"',
      newlinesBetween => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              newlinesBetween,
            }),
          ),
        ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
      },
    )

    it.each(ALWAYS_OPTIONS)(
      'should return the entered newlinesBetween ("%s") if nodeGroupNumber !== nextNodeGroupNumber',
      newlinesBetween => {
        let groups = ['group1', 'group2']
        expect(
          getNewlinesBetweenOption({
            options: {
              newlinesBetween,
              groups,
            },
            nextNodeGroupIndex: generateNodeGroupIndex(groups, 'group2'),
            nodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
          }),
        ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
      },
    )

    it('should return 1 if "newlinesBetween" is "always" and nodeGroupIndex !== nextNodeGroupIndex', () => {
      let groups = ['group1', 'group2']
      expect(
        getNewlinesBetweenOption({
          options: {
            newlinesBetween: 'always',
            groups,
          },
          nextNodeGroupIndex: generateNodeGroupIndex(groups, 'group2'),
          nodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
        }),
      ).toBe(1)
    })

    it.each(NEVER_OPTIONS)(
      'should return 0 if "newlinesBetween" is "always" and nodeGroupNumber === nextNodeGroupNumber',
      () => {
        let groups = ['group1']
        expect(
          getNewlinesBetweenOption({
            options: {
              newlinesBetween: 'always',
              groups,
            },
            nextNodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
            nodeGroupIndex: generateNodeGroupIndex(groups, 'group1'),
          }),
        ).toBe(0)
      },
    )

    it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
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
        ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
      },
    )

    it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
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
        ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
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
        nextNodeGroupIndexGroup: 'group1',
        sortingNodeGroup: 'group1',
      } as const

      it.each([...ALWAYS_OPTIONS, ...NEVER_OPTIONS] as const)(
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
          ).toBe(convertNewlinesBetweenOptionToNumber(newlinesInside))
        },
      )

      it.each(['ignore', ...NEVER_OPTIONS] as const)(
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
          ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
        },
      )
    })

    describe('when the node and next node do not belong to the same custom group', () => {
      it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
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
          ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
        },
      )
    })

    describe('newlinesBetween option between two groups', () => {
      let availableOptions = [
        ...ALWAYS_OPTIONS,
        ...NEVER_OPTIONS,
        'ignore',
      ] as const
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
          ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
        },
      )

      describe('non-adjacent groups', () => {
        it.each(['always', 1, 'ignore', ...NEVER_OPTIONS] as const)(
          'should return 1 if the global option is `always` and `%s` exists between the groups',
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
            ).toBe(1)
          },
        )

        it.each([1, 'always', 'ignore', ...NEVER_OPTIONS] as const)(
          'should return 1 if `always` exists between the groups and global option is `%s`',
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
            ).toBe(1)
          },
        )

        it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
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

        it.each(['ignore', ...NEVER_OPTIONS] as const)(
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

        it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
          'should return 0 if there are only `never` between all groups and global option is `%s`',
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
            ).toBe(0)
          },
        )

        it.each([...ALWAYS_OPTIONS, 'ignore', ...NEVER_OPTIONS] as const)(
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
            ).toBe(convertNewlinesBetweenOptionToNumber(newlinesBetween))
          },
        )
      })
    })
  })

  let buildParameters = ({
    nextNodeGroupIndexGroup,
    sortingNodeGroup,
    newlinesBetween,
    customGroups,
    groups,
  }: {
    newlinesBetween: GetNewlinesBetweenOptionParameters['options']['newlinesBetween']
    customGroups?: GetNewlinesBetweenOptionParameters['options']['customGroups']
    groups?: GetNewlinesBetweenOptionParameters['options']['groups']
    nextNodeGroupIndexGroup?: string
    sortingNodeGroup?: string
  }): GetNewlinesBetweenOptionParameters => {
    let finalGroups = groups ?? ['group1', 'group2']
    return {
      nextNodeGroupIndex: generateNodeGroupIndex(
        finalGroups,
        nextNodeGroupIndexGroup ?? 'group2',
      ),
      nodeGroupIndex: generateNodeGroupIndex(
        finalGroups,
        sortingNodeGroup ?? 'group1',
      ),
      options: {
        groups: finalGroups,
        newlinesBetween,
        customGroups,
      },
    }
  }

  let generateNodeGroupIndex = (
    groups: GetNewlinesBetweenOptionParameters['options']['groups'],
    group: string,
  ): number => groups.indexOf(group)
})

let convertNewlinesBetweenOptionToNumber = (
  newlinesBetween: NewlinesBetweenOption,
): 'ignore' | number => {
  if (typeof newlinesBetween === 'number') {
    return newlinesBetween
  }
  switch (newlinesBetween) {
    case 'ignore':
      return 'ignore'
    case 'always':
      return 1
    case 'never':
      return 0
    default:
      throw new UnreachableCaseError(newlinesBetween)
  }
}
