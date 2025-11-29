import type { Mock } from 'vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ComparatorByOptionsComputer } from '../../../utils/compare/default-comparator-by-options-computer'
import type { CommonOptions, TypeOption } from '../../../types/common-options'
import type { SortingNode } from '../../../types/sorting-node'

import { defaultComparatorByOptionsComputer } from '../../../utils/compare/default-comparator-by-options-computer'
import { computeComparators } from '../../../utils/compare/compute-comparators'

describe('compute-comparators', () => {
  let comparatorByOptionsComputerMock: Mock<
    ComparatorByOptionsComputer<CommonOptions, SortingNode>
  >

  beforeEach(() => {
    comparatorByOptionsComputerMock = vi.fn()
  })

  it('should compute two comparators if the main one is not the unsorted comparator', () => {
    let commonOptions = buildCommonOptions('alphabetical')

    computeComparators(comparatorByOptionsComputerMock, commonOptions)

    expect(comparatorByOptionsComputerMock).toHaveBeenCalledTimes(2)
    expect(comparatorByOptionsComputerMock.mock.calls[0]?.[0]).toEqual(
      commonOptions,
    )
    expect(comparatorByOptionsComputerMock.mock.calls[1]?.[0]).toEqual({
      ...commonOptions,
      ...commonOptions.fallbackSort,
    })
  })

  it('should return an empty array if the main comparator is the unsorted comparator', () => {
    let commonOptions = buildCommonOptions('unsorted')

    let comparators = computeComparators(
      defaultComparatorByOptionsComputer,
      commonOptions,
    )

    expect(comparators).toEqual([])
  })

  function buildCommonOptions(type: TypeOption): CommonOptions {
    return {
      fallbackSort: {
        type: 'natural',
        order: 'desc',
      },
      specialCharacters: 'trim',
      ignoreCase: true,
      locales: ['en'],
      order: 'asc',
      alphabet: '',
      type,
    }
  }
})
