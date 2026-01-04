import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { GroupsOptions } from '../../types/common-groups-options'
import type { SortingNode } from '../../types/sorting-node'

import { buildSubgroupOrderComparator } from './build-subgroup-order-comparator'
import { buildLineLengthComparator } from './build-line-length-comparator'
import { compareAlphabetically } from './compare-alphabetically'
import { UnreachableCaseError } from '../unreachable-case-error'
import { compareByCustomSort } from './compare-by-custom-sort'
import { unsortedComparator } from './unsorted-comparator'
import { compareNaturally } from './compare-naturally'

export type ComparatorByOptionsComputer<S, T extends SortingNode> = (
  options: S,
) => Comparator<T>

export type Comparator<T extends SortingNode> = (a: T, b: T) => number

type Options = Pick<
  CommonOptions<TypeOption>,
  'specialCharacters' | 'ignoreCase' | 'alphabet' | 'locales' | 'order' | 'type'
> &
  Pick<CommonOptions, 'fallbackSort'> & {
    groups?: GroupsOptions
  }

export let defaultComparatorByOptionsComputer: ComparatorByOptionsComputer<
  Options,
  SortingNode
> = options => {
  switch (options.type) {
    case 'subgroup-order':
      /* v8 ignore start -- @preserve sort-switch-case specific */
      if (!options.groups) {
        return unsortedComparator
      }
      /* v8 ignore stop -- @preserve sort-switch-case specific */
      return buildSubgroupOrderComparator({
        ...options,
        groups: options.groups,
      })
    case 'alphabetical':
      return (a, b) => compareAlphabetically(a.name, b.name, options)
    case 'line-length':
      return buildLineLengthComparator(options)
    case 'unsorted':
      return unsortedComparator
    case 'natural':
      return (a, b) => compareNaturally(a.name, b.name, options)
    case 'custom':
      return (a, b) => compareByCustomSort(a.name, b.name, options)
    /* v8 ignore next 2 -- @preserve Exhaustive guard. */
    default:
      throw new UnreachableCaseError(options.type)
  }
}
