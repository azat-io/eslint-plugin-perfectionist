import { describe, expect, it } from 'vitest'

import type { GetNewlinesBetweenOptionParameters } from '../utils/get-newlines-between-option'
import type { SortingNode } from '../types/sorting-node'

import { getNewlinesBetweenOption } from '../utils/get-newlines-between-option'

describe('get-newlines-between-option', () => {
  describe('global "newlinesBetween" option', () => {
    it('should return the global option if "customGroups" is not defined', () => {
      expect(
        getNewlinesBetweenOption(
          buildParameters({
            newlinesBetween: 'ignore',
          }),
        ),
      ).toBe('ignore')
    })

    it('should return the global option if "customGroups" is not an array', () => {
      expect(
        getNewlinesBetweenOption(
          buildParameters({
            newlinesBetween: 'ignore',
            customGroups: {},
          }),
        ),
      ).toBe('ignore')
    })

    it('should return "ignore" if "newlinesBetween" is "ignore"', () => {
      expect(
        getNewlinesBetweenOption(
          buildParameters({
            newlinesBetween: 'ignore',
          }),
        ),
      ).toBe('ignore')
    })

    it('should return "never" if "newlinesBetween" is "never"', () => {
      expect(
        getNewlinesBetweenOption(
          buildParameters({
            newlinesBetween: 'never',
          }),
        ),
      ).toBe('never')
    })

    it('should return "always" if "newlinesBetween" is "always" and nodeGroupNumber !== nextNodeGroupNumber', () => {
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

    it('should return "never" if "newlinesBetween" is "always" and nodeGroupNumber === nextNodeGroupNumber', () => {
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

    it("should return the global option if the node's group is within an array", () => {
      expect(
        getNewlinesBetweenOption(
          buildParameters({
            customGroups: [
              {
                groupName: 'group1',
              },
            ],
            groups: [['group1', 'group3'], 'group2'],
            newlinesBetween: 'never',
          }),
        ),
      ).toBe('never')
    })

    it("should return the global option if the next node's group is within an array", () => {
      expect(
        getNewlinesBetweenOption(
          buildParameters({
            customGroups: [
              {
                groupName: 'group1',
              },
            ],
            groups: ['group1', ['group2', 'group3']],
            newlinesBetween: 'never',
          }),
        ),
      ).toBe('never')
    })
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
        newlinesBetween: 'never',
      } as const

      it('should return the "newlinesInside" option if defined', () => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              ...parameters,
              customGroups: [
                {
                  newlinesInside: 'always',
                  groupName: 'group1',
                },
              ],
            }),
          ),
        ).toBe('always')
      })

      it('should return the global option if the "newlinesInside" option is not defined', () => {
        expect(
          getNewlinesBetweenOption(
            buildParameters({
              ...parameters,
              customGroups: [
                {
                  groupName: 'group1',
                },
              ],
            }),
          ),
        ).toBe('never')
      })
    })

    describe('when the node and next node do not belong to the same custom group', () => {
      it('should return the global option', () => {
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
              newlinesBetween: 'never',
            }),
          ),
        ).toBe('never')
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
