import { describe, expect, it } from 'vitest'

import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'

describe('validate-newlines-and-partition-configuration', () => {
  it.each([1, 0] as const)(
    "throws an error when 'partitionByNewline' is enabled and 'newlinesBetween' is '%s'",
    newlinesBetween => {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          partitionByNewLine: true,
          newlinesBetween,
          groups: [],
        })
      }).toThrow(
        "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
      )
    },
  )

  it.each([1, 0, 'ignore'] as const)(
    "throws an error when 'partitionByNewline' is enabled and `newlinesBetween: '%s'` objects exist in 'groups'",
    newlinesBetween => {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          groups: [{ newlinesBetween }],
          newlinesBetween: 'ignore',
          partitionByNewLine: true,
        })
      }).toThrow(
        "'newlinesBetween' objects can not be used in 'groups' alongside 'partitionByNewLine'",
      )
    },
  )

  it("allows 'partitionByNewline' when 'newlinesBetween' is 'ignore'", () => {
    expect(() => {
      validateNewlinesAndPartitionConfiguration({
        newlinesBetween: 'ignore',
        partitionByNewLine: true,
        groups: [],
      })
    }).not.toThrow()
  })

  it.each([1, 0, 'ignore'] as const)(
    "allows `newlinesBetween: '%s'` when 'partitionByNewline' is 'false'",
    newlinesBetween => {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          partitionByNewLine: false,
          newlinesBetween,
          groups: [],
        })
      }).not.toThrow()
    },
  )
})
