import { describe, expect, it } from 'vitest'

import { validateNewlinesAndPartitionConfiguration } from '../../utils/validate-newlines-and-partition-configuration'

describe('validate-newlines-and-partition-configuration', () => {
  it("throws an error when 'partitionByNewline' is enabled and 'newlinesBetween' is not 'ignore'", () => {
    let newlinesBetweenValues = ['always', 'never'] as const

    for (let newlinesBetween of newlinesBetweenValues) {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          partitionByNewLine: true,
          newlinesBetween,
        })
      }).toThrow(
        "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
      )
    }
  })

  it("allows 'partitionByNewline' when 'newlinesBetween' is 'ignore'", () => {
    expect(() => {
      validateNewlinesAndPartitionConfiguration({
        newlinesBetween: 'ignore',
        partitionByNewLine: true,
      })
    }).not.toThrow()
  })

  it("allows 'newlinesBetween' when 'partitionByNewline' is 'false'", () => {
    let newlinesBetweenValues = ['always', 'never', 'ignore'] as const

    for (let newlinesBetween of newlinesBetweenValues) {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          partitionByNewLine: false,
          newlinesBetween,
        })
      }).not.toThrow()
    }
  })
})
