import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { SortImportsSortingNode, Options } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { buildLineLengthComparator } from '../../utils/compare/build-line-length-comparator'
import { compareAlphabetically } from '../../utils/compare/compare-alphabetically'
import { compareByCustomSort } from '../../utils/compare/compare-by-custom-sort'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'
import { unsortedComparator } from '../../utils/compare/unsorted-comparator'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'
import { compareNaturally } from '../../utils/compare/compare-naturally'

export let comparatorByOptionsComputer: ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortImportsSortingNode
> = options => {
  switch (options.type) {
    case 'type-import-first':
      return (a, b) => compareTypeImportFirst(a, b, options)
    case 'subgroup-order':
    case 'alphabetical':
    case 'line-length':
    case 'unsorted':
    case 'natural':
    case 'custom':
      switch (options.sortBy) {
        case 'specifier':
          return bySpecifierComparatorByOptionsComputer({
            ...options,
            type: options.type,
          })
        case 'path':
          return defaultComparatorByOptionsComputer({
            ...options,
            type: options.type,
          })
        /* v8 ignore next 2 -- @preserve Exhaustive guard. */
        default:
          throw new UnreachableCaseError(options.sortBy)
      }
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.type)
  }
}

/**
 * Compares two import nodes to sort type imports before regular imports.
 *
 * When both nodes are type imports or both are regular imports, returns 0
 * (equal). Otherwise, sorts type imports first based on the order option.
 *
 * @param a - The first import sorting node.
 * @param b - The second import sorting node.
 * @param options - Options containing the sort order.
 * @returns A negative number if a should come first, positive if b should.
 */
function compareTypeImportFirst(
  a: SortImportsSortingNode,
  b: SortImportsSortingNode,
  options: Pick<CommonOptions, 'order'>,
): number {
  if (a.isTypeImport && b.isTypeImport) {
    return 0
  }
  if (!a.isTypeImport && !b.isTypeImport) {
    return 0
  }

  return computeOrderedValue(a.isTypeImport ? -1 : 1, options.order)
}

let bySpecifierComparatorByOptionsComputer: ComparatorByOptionsComputer<
  Omit<Required<Options[number]>, 'type'> & { type: TypeOption },
  SortImportsSortingNode
> = options => {
  switch (options.type) {
    /* v8 ignore next 2 -- @preserve Untested for now as not a relevant sort for this rule. */
    case 'subgroup-order':
      return defaultComparatorByOptionsComputer(options)
    case 'alphabetical':
      return (a, b) =>
        compareAlphabetically(
          a.specifierName ?? '',
          b.specifierName ?? '',
          options,
        )
    case 'line-length':
      return buildLineLengthComparator(options)
    case 'unsorted':
      return unsortedComparator
    case 'natural':
      return (a, b) =>
        compareNaturally(a.specifierName ?? '', b.specifierName ?? '', options)
    case 'custom':
      return (a, b) =>
        compareByCustomSort(
          a.specifierName ?? '',
          b.specifierName ?? '',
          options,
        )
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.type)
  }
}
