import type { Mock } from 'vitest'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ComparatorByOptionsComputer } from '../../../utils/compare/default-comparator-by-options-computer'
import type { CommonOptions } from '../../../types/common-options'
import type { SortingNode } from '../../../types/sorting-node'

import { computeComparators } from '../../../utils/compare/compute-comparators'

describe('compute-comparators', () => {
  let testComparator: Mock<
    ComparatorByOptionsComputer<CommonOptions, SortingNode>
  >

  beforeEach(() => {
    testComparator = vi.fn()
  })

  it('should compute two comparators', () => {
    let commonOptions = {
      fallbackSort: {
        type: 'natural',
        order: 'desc',
      },
      specialCharacters: 'trim',
      type: 'alphabetical',
      ignoreCase: true,
      locales: ['en'],
      order: 'asc',
      alphabet: '',
    } as const

    computeComparators(testComparator, {
      ...commonOptions,
      fallbackSort: {
        type: 'natural',
        order: 'desc',
      },
    })

    expect(testComparator).toHaveBeenCalledTimes(2)
    expect(testComparator.mock.calls[0]?.[0]).toEqual(commonOptions)
    expect(testComparator.mock.calls[1]?.[0]).toEqual({
      ...commonOptions,
      ...commonOptions.fallbackSort,
    })
  })
})
