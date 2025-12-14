import type {
  ComparatorByOptionsComputer,
  Comparator,
} from './default-comparator-by-options-computer'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { unsortedComparator } from './unsorted-comparator'

/**
 * Computes the array of comparators to use for sorting based on options.
 *
 * Returns an array containing the main comparator and a fallback comparator. If
 * the main comparator is the unsorted comparator, returns an empty array since
 * no sorting should be performed.
 *
 * @param comparatorByOptionsComputer - Function that creates a comparator from
 *   options.
 * @param options - The sorting options including fallback sort configuration.
 * @returns An array of comparators, or empty array if sorting is disabled.
 */
export function computeComparators<
  Options extends Pick<CommonOptions, 'fallbackSort'>,
  T extends SortingNode,
>(
  comparatorByOptionsComputer: ComparatorByOptionsComputer<Options, T>,
  options: Options,
): Comparator<T>[] {
  let mainComparator = comparatorByOptionsComputer(options)
  if (mainComparator === unsortedComparator) {
    return []
  }

  let fallbackComparator = comparatorByOptionsComputer({
    ...options,
    ...options.fallbackSort,
  })
  return [mainComparator, fallbackComparator]
}
