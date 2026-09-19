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

/**
 * Builds a comparator computer that compares sorting nodes by a string computed
 * from each node, according to the sort type of the options.
 *
 * Sort types that do not compare strings, such as line length or subgroup
 * order, ignore the computed string.
 *
 * @param computeValue - Computes the string to compare for a sorting node.
 * @returns A function that computes a comparator from sorting options.
 */
export function buildStringComparatorByOptionsComputer<T extends SortingNode>(
  computeValue: (node: T) => string,
): ComparatorByOptionsComputer<Options, T> {
  return options => {
    switch (options.type) {
      case 'subgroup-order':
        if (!options.groups) {
          return unsortedComparator
        }
        return buildSubgroupOrderComparator({
          ...options,
          groups: options.groups,
        })
      case 'alphabetical':
        return (a, b) =>
          compareAlphabetically(computeValue(a), computeValue(b), options)
      case 'line-length':
        return buildLineLengthComparator(options)
      case 'unsorted':
        return unsortedComparator
      case 'natural':
        return (a, b) =>
          compareNaturally(computeValue(a), computeValue(b), options)
      case 'custom':
        return (a, b) =>
          compareByCustomSort(computeValue(a), computeValue(b), options)
      /* v8 ignore next 2 -- @preserve Exhaustive guard. */
      default:
        throw new UnreachableCaseError(options.type)
    }
  }
}

export let defaultComparatorByOptionsComputer: ComparatorByOptionsComputer<
  Options,
  SortingNode
> = buildStringComparatorByOptionsComputer(node => node.name)
