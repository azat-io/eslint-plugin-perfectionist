import type {
  ComparatorByOptionsComputer,
  Comparator,
} from './default-comparator-by-options-computer'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { unsortedComparator } from './unsorted-comparator'

export function computeComparators<
  Options extends CommonOptions,
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
