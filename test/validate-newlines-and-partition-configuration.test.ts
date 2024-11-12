import { describe, expect, it } from 'vitest'

import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'

describe('validate-newlines-and-partition-configuration', () => {
  let partitionByNewlineValues = [true, 1] as const

  it("throws an error when 'partitionComment' is enabled and 'newlinesBetween' is not 'ignore'", () => {
    let newlinesBetweenValues = ['always', 'never'] as const

    for (let newlinesBetween of newlinesBetweenValues) {
      for (let partitionByNewline of partitionByNewlineValues) {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            newlinesBetween,
            partitionByNewLine: partitionByNewline,
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
        )
      }
    }
  })

  it("allows 'partitionByNewLine' when 'newlinesBetween' is 'ignore'", () => {
    for (let partitionByNewLine of partitionByNewlineValues) {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          newlinesBetween: 'ignore',
          partitionByNewLine,
        })
      }).not.toThrow()
    }
  })

  it("allows 'newlinesBetween' when 'partitionByComment' is 'false'", () => {
    let newlinesBetweenValues = ['always', 'never', 'ignore'] as const

    for (let newlinesBetween of newlinesBetweenValues) {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          newlinesBetween,
          partitionByNewLine: false,
        })
      }).not.toThrow()
    }
  })
})
