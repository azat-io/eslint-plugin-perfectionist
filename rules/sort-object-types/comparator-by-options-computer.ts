import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortObjectTypesSortingNode, Options } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildSubgroupOrderComparator } from '../../utils/compare/build-subgroup-order-comparator'
import { buildLineLengthComparator } from '../../utils/compare/build-line-length-comparator'
import { compareAlphabetically } from '../../utils/compare/compare-alphabetically'
import { compareByCustomSort } from '../../utils/compare/compare-by-custom-sort'
import { unsortedComparator } from '../../utils/compare/unsorted-comparator'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { compareNaturally } from '../../utils/compare/compare-naturally'

export let comparatorByOptionsComputer: ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortObjectTypesSortingNode
> = options => {
  switch (options.sortBy) {
    case 'value':
      return byValueComparatorComputer(options)
    case 'name':
      return defaultComparatorByOptionsComputer(options)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.sortBy)
  }
}

let byValueComparatorComputer: ComparatorByOptionsComputer<
  { subgroupOrder?: string[] | null } & Required<Options[number]>,
  SortObjectTypesSortingNode
> = options => {
  switch (options.type) {
    case 'subgroup-order':
      return buildSubgroupOrderComparator(
        options.subgroupOrder ?? null,
        options.order,
      )
    case 'alphabetical':
      return (a, b) => compareAlphabetically(a.value, b.value, options)
    case 'line-length':
      return buildLineLengthComparator(options)
    case 'unsorted':
      return unsortedComparator
    case 'natural':
      return (a, b) => compareNaturally(a.value, b.value, options)
    case 'custom':
      return (a, b) => compareByCustomSort(a.value, b.value, options)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.type)
  }
}
