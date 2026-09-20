import type { ComparatorByOptionsComputer } from './default-comparator-by-options-computer'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildStringComparatorByOptionsComputer,
  defaultComparatorByOptionsComputer,
} from './default-comparator-by-options-computer'
import { UnreachableCaseError } from '../unreachable-case-error'

type Options = Parameters<typeof defaultComparatorByOptionsComputer>[0] & {
  sortBy: 'value' | 'name'
}

interface SortingNodeWithValue extends SortingNode {
  value: string
}

let byValueComparatorByOptionsComputer =
  buildStringComparatorByOptionsComputer<SortingNodeWithValue>(
    node => node.value,
  )

/**
 * Computes a comparator that compares sorting nodes either by name or by value,
 * depending on the `sortBy` option.
 *
 * @param options - Sorting options.
 * @returns A comparator for sorting nodes.
 */
export let nameOrValueComparatorByOptionsComputer: ComparatorByOptionsComputer<
  Options,
  SortingNodeWithValue
> = options => {
  switch (options.sortBy) {
    case 'value':
      return byValueComparatorByOptionsComputer(options)
    case 'name':
      return defaultComparatorByOptionsComputer(options)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.sortBy)
  }
}
