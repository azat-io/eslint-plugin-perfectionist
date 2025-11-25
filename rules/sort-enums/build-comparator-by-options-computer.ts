import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { SortEnumsSortingNode, Options } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildLineLengthComparator } from '../../utils/compare/build-line-length-comparator'
import { compareAlphabetically } from '../../utils/compare/compare-alphabetically'
import { compareByCustomSort } from '../../utils/compare/compare-by-custom-sort'
import { unsortedComparator } from '../../utils/compare/unsorted-comparator'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { compareNaturally } from '../../utils/compare/compare-naturally'

export function buildComparatorByOptionsComputer(
  isNumericEnum: boolean,
): ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortEnumsSortingNode
> {
  return options => {
    switch (options.sortByValue) {
      case 'ifNumericEnum':
        if (isNumericEnum) {
          return byNumericValueComparatorComputer(options)
        }
        return defaultComparatorByOptionsComputer(options)
      case 'always':
        if (isNumericEnum) {
          return byNumericValueComparatorComputer(options)
        }
        return byNonNumericValueComparatorComputer(options)
      case 'never':
        return defaultComparatorByOptionsComputer(options)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(options.sortByValue)
    }
  }
}

let byNonNumericValueComparatorComputer: ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortEnumsSortingNode
> = options => {
  switch (options.type) {
    case 'alphabetical':
      return (a, b) =>
        compareAlphabetically(a.value ?? '', b.value ?? '', options)
    case 'line-length':
      return buildLineLengthComparator(options)
    case 'unsorted':
      return unsortedComparator
    case 'natural':
      return (a, b) => compareNaturally(a.value ?? '', b.value ?? '', options)
    case 'custom':
      return (a, b) =>
        compareByCustomSort(a.value ?? '', b.value ?? '', options)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.type)
  }
}

let byNumericValueComparatorComputer: ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortEnumsSortingNode
> = options => {
  switch (options.type) {
    case 'alphabetical':
    case 'line-length':
    case 'natural':
    case 'custom':
      return (a, b) =>
        compareNaturally(
          a.numericValue!.toString(),
          b.numericValue!.toString(),
          options,
        )
    case 'unsorted':
      return unsortedComparator
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.type)
  }
}
