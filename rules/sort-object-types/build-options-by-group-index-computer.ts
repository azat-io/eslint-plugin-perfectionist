import type { OptionsByGroupIndexComputer } from '../../utils/sort-nodes-by-groups'
import type { Options } from './types'

import { computeOverriddenOptionsByGroupIndex } from '../../utils/compute-overridden-options-by-group-index'
import { computeGroupName } from '../../utils/compute-group-name'

/**
 * Retrieves sorting options for a specific group with object-type-specific
 * overrides.
 *
 * Extends the base custom groups functionality to support 'sortBy' option,
 * which determines whether to sort object type members by their key name or
 * value. Custom groups can override both the primary sortBy and fallback sortBy
 * settings.
 *
 * @param options - Rule options including custom groups configuration.
 * @returns Sorting options with appropriate node value getters for the sort
 *   strategy.
 */
export function buildOptionsByGroupIndexComputer(
  options: Required<Options[number]>,
): OptionsByGroupIndexComputer<Required<Options[number]>> {
  return groupIndex => computeOptionsForGroupIndex(options, groupIndex)
}

function computeOptionsForGroupIndex(
  options: Required<Options[number]>,
  groupIndex: number,
): Required<Options[number]> {
  let overriddenOptions = computeOverriddenOptionsByGroupIndex(
    options,
    groupIndex,
  )

  let { fallbackSort, customGroups, sortBy, groups } = options
  let fallbackSortBy = fallbackSort.sortBy
  let group = groups[groupIndex]
  let groupName = group ? computeGroupName(group) : null
  let customGroup = customGroups.find(
    currentGroup => groupName === currentGroup.groupName,
  )

  if (customGroup) {
    fallbackSortBy = customGroup.fallbackSort?.sortBy ?? fallbackSortBy
    if ('sortBy' in customGroup && customGroup.sortBy) {
      ;({ sortBy } = customGroup)
    }
  }

  return {
    ...overriddenOptions,
    fallbackSort: {
      ...overriddenOptions.fallbackSort,
      ...(fallbackSortBy ? { sortBy: fallbackSortBy } : {}),
    },
    sortBy,
  }
}
