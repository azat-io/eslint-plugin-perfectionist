import type { OptionsByGroupIndexComputer } from './sort-nodes-by-groups'
import type { CommonGroupsOptions } from '../types/common-groups-options'
import type { CommonOptions } from '../types/common-options'

import { computeOverriddenOptionsByGroupIndex } from './compute-overridden-options-by-group-index'

type Options = Pick<
  CommonGroupsOptions<unknown, unknown, string>,
  'customGroups' | 'groups'
> &
  CommonOptions

/**
 * Creates a function that retrieves overridden options for a specific group
 * index.
 *
 * Returns a closure that captures the options and provides a convenient way to
 * get overridden options for any group index. This is used in sorting
 * algorithms that need to apply different sorting rules to different groups.
 *
 * @example
 *   const getOverriddenOptions =
 *     buildDefaultOptionsByGroupIndexComputer(options)
 *   const group1Options = getOverriddenOptions(0)
 *   const group2Options = getOverriddenOptions(1)
 *
 * @param options - Base sorting options with group configuration.
 * @returns Function that takes a group index and returns overridden options.
 */
export function buildDefaultOptionsByGroupIndexComputer<T extends Options>(
  options: T,
): OptionsByGroupIndexComputer<T> {
  return groupIndex => computeOverriddenOptionsByGroupIndex(options, groupIndex)
}
