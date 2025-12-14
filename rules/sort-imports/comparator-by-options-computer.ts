import type { ComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import type { CommonOptions } from '../../types/common-options'
import type { SortImportsSortingNode, Options } from './types'

import { defaultComparatorByOptionsComputer } from '../../utils/compare/default-comparator-by-options-computer'
import { computeOrderedValue } from '../../utils/compare/compute-ordered-value'
import { UnreachableCaseError } from '../../utils/unreachable-case-error'

export let comparatorByOptionsComputer: ComparatorByOptionsComputer<
  Required<Options[number]>,
  SortImportsSortingNode
> = options => {
  switch (options.type) {
    case 'type-import-first':
      return (a, b) => compareTypeImportFirst(a, b, options)
    case 'alphabetical':
    case 'line-length':
    case 'unsorted':
    case 'natural':
    case 'custom':
      return defaultComparatorByOptionsComputer({
        ...options,
        type: options.type,
      })
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
