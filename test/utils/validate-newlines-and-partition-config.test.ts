import { describe, expect, it } from 'vitest'

import { validateNewlinesAndPartitionConfig } from '../../utils/validate-newlines-and-partition-config'

describe('validate-newlines-and-partition-config', () => {
  describe('newlinesBetween', () => {
    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and 'newlinesBetween' is '%s'",
      newlinesBetween => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            customGroups: [],
            newlinesBetween,
            groups: [],
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
        )
      },
    )

    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and `newlinesBetween: '%s'` objects exist in 'groups'",
      newlinesBetween => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            groups: [{ newlinesBetween }],
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            customGroups: [],
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
        )
      },
    )

    it.each([1, 0, 'ignore'] as const)(
      "allows `newlinesBetween: '%s'` when 'partitionByNewline' is 'false'",
      newlinesBetween => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            partitionByNewLine: false,
            newlinesInside: 'ignore',
            customGroups: [],
            newlinesBetween,
            groups: [],
          })
        }).not.toThrow()
      },
    )
  })

  describe('newlinesInside', () => {
    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and 'newlinesInside' is '%s'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            customGroups: [],
            newlinesInside,
            groups: [],
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together",
        )
      },
    )

    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and `newlinesInside: '%s'` exists in 'groups'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            groups: [{ group: 'group', newlinesInside }],
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            customGroups: [],
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together",
        )
      },
    )

    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and `newlinesInside: '%s'` exists in 'customGroups'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            customGroups: [{ groupName: 'group', newlinesInside }],
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            groups: ['group'],
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together",
        )
      },
    )

    it.each(['ignore', 'newlinesBetween'] as const)(
      "allows `newlinesInside: '%s'` when 'partitionByNewline' enabled'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            customGroups: [],
            newlinesInside,
            groups: [],
          })
        }).not.toThrow()
      },
    )

    it.each([1, 0, 'ignore'] as const)(
      "allows `newlinesInside: '%s'` when 'partitionByNewline' is 'false'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfig({
            partitionByNewLine: false,
            newlinesBetween: 'ignore',
            customGroups: [],
            newlinesInside,
            groups: [],
          })
        }).not.toThrow()
      },
    )
  })

  it("allows 'partitionByNewline' when 'newlinesInside' and 'newlinesBetween' are 'ignore'", () => {
    expect(() => {
      validateNewlinesAndPartitionConfig({
        groups: [
          { newlinesInside: 'ignore', group: 'group1' },
          { newlinesBetween: 'ignore' },
          { group: 'group2', type: 'natural' },
        ],
        customGroups: [{ newlinesInside: 'ignore', groupName: 'group' }],
        newlinesBetween: 'ignore',
        partitionByNewLine: true,
        newlinesInside: 'ignore',
      })
    }).not.toThrow()
  })
})
