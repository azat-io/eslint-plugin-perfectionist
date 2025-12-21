import { describe, expect, it } from 'vitest'

import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'

describe('validate-newlines-and-partition-configuration', () => {
  describe('newlinesBetween', () => {
    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and 'newlinesBetween' is '%s'",
      newlinesBetween => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            customGroups: [],
            newlinesBetween,
            groups: [],
          })
        }).toThrowError(
          "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
        )
      },
    )

    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and `newlinesBetween: '%s'` objects exist in 'groups'",
      newlinesBetween => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            groups: [{ newlinesBetween }],
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            customGroups: [],
          })
        }).toThrowError(
          "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
        )
      },
    )

    it.each([1, 0, 'ignore'] as const)(
      "allows `newlinesBetween: '%s'` when 'partitionByNewline' is 'false'",
      newlinesBetween => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            partitionByNewLine: false,
            newlinesInside: 'ignore',
            customGroups: [],
            newlinesBetween,
            groups: [],
          })
        }).not.toThrowError()
      },
    )
  })

  describe('newlinesInside', () => {
    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and 'newlinesInside' is '%s'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            customGroups: [],
            newlinesInside,
            groups: [],
          })
        }).toThrowError(
          "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together",
        )
      },
    )

    it.each([1, 0, 'ignore'] as const)(
      "allows `newlinesInside: '%s'` when 'partitionByNewline' is 'false'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            partitionByNewLine: false,
            newlinesBetween: 'ignore',
            customGroups: [],
            newlinesInside,
            groups: [],
          })
        }).not.toThrowError()
      },
    )

    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and `newlinesInside: '%s'` exists in 'groups'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            groups: [{ group: 'group', newlinesInside }],
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            customGroups: [],
          })
        }).toThrowError(
          "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together",
        )
      },
    )

    it.each([1, 0] as const)(
      "throws an error when 'partitionByNewline' is enabled and `newlinesInside: '%s'` exists in 'customGroups'",
      newlinesInside => {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            customGroups: [{ groupName: 'group', newlinesInside }],
            newlinesBetween: 'ignore',
            partitionByNewLine: true,
            newlinesInside: 'ignore',
            groups: ['group'],
          })
        }).toThrowError(
          "The 'partitionByNewLine' and 'newlinesInside' options cannot be used together",
        )
      },
    )
  })

  it("allows 'partitionByNewline' when 'newlinesInside' and 'newlinesBetween' are 'ignore'", () => {
    expect(() => {
      validateNewlinesAndPartitionConfiguration({
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
    }).not.toThrowError()
  })
})
