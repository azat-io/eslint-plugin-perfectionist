import type {
  ComparatorByOptionsComputer,
  Comparator,
} from './default-comparator-by-options-computer'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export function computeComparators<
  Options extends CommonOptions,
  T extends SortingNode,
>(
  comparatorByOptionsComputer: ComparatorByOptionsComputer<Options, T>,
  options: Options,
): Comparator<T>[] {
  return [
    comparatorByOptionsComputer(options),
    comparatorByOptionsComputer({
      ...options,
      ...options.fallbackSort,
    }),
  ]
}
