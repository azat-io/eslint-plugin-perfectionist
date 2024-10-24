import { describe, expect, it } from 'vitest'

import { validateNewlinesAndPartitionConfiguration } from '../utils/validate-newlines-and-partition-configuration'

describe('validate-newlines-and-partition-configuration', () => {
  let partitionByCommentValues: (string[] | boolean | string)[] = [
    true,
    'partitionComment',
    ['partition1', 'partition2'],
  ]

  it("throws an error when 'partitionComment' is enabled and 'newlinesBetween' is not 'ignore'", () => {
    let newlinesBetweenValues = ['always', 'never'] as const

    for (let newlinesBetween of newlinesBetweenValues) {
      for (let partitionByComment of partitionByCommentValues) {
        expect(() => {
          validateNewlinesAndPartitionConfiguration({
            newlinesBetween,
            partitionByNewLine: partitionByComment,
          })
        }).toThrow(
          "The 'partitionByNewLine' and 'newlinesBetween' options cannot be used together",
        )
      }
    }
  })

  it("allows 'partitionComment' when 'newlinesBetween' is 'ignore'", () => {
    for (let partitionByComment of partitionByCommentValues) {
      expect(() => {
        validateNewlinesAndPartitionConfiguration({
          newlinesBetween: 'ignore',
          partitionByNewLine: partitionByComment,
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
