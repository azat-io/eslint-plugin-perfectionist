import type { NodeValueGetterFunction } from '../../utils/compare'
import type { SortObjectTypesSortingNode, Options } from './types'

import { getCustomGroupsCompareOptions as baseGetCustomGroupsCompareOptions } from '../../utils/get-custom-groups-compare-options'
import { buildNodeValueGetter } from './build-node-value-getter'

/** Subset of options needed for determining compare behavior for object types. */
type InputOptions = Pick<
  Required<Options[0]>,
  'fallbackSort' | 'customGroups' | 'sortBy' | 'groups' | 'order' | 'type'
>

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
 * @param groupIndex - Index of the group to get options for.
 * @returns Sorting options with appropriate node value getters for the sort
 *   strategy.
 */
export function getCustomGroupsCompareOptions(
  options: InputOptions,
  groupIndex: number,
): {
  options: Pick<
    Required<Options[0]>,
    'fallbackSort' | 'sortBy' | 'order' | 'type'
  >
  fallbackSortNodeValueGetter?: NodeValueGetterFunction<SortObjectTypesSortingNode> | null
  nodeValueGetter?: NodeValueGetterFunction<SortObjectTypesSortingNode> | null
} {
  let baseCompareOptions = baseGetCustomGroupsCompareOptions(
    options,
    groupIndex,
  )

  let { fallbackSort, customGroups, sortBy, groups } = options
  let fallbackSortBy = fallbackSort.sortBy
  let group = groups[groupIndex]
  let customGroup =
    typeof group === 'string'
      ? customGroups.find(currentGroup => group === currentGroup.groupName)
      : null

  if (customGroup) {
    fallbackSortBy = customGroup.fallbackSort?.sortBy ?? fallbackSortBy
    if ('sortBy' in customGroup && customGroup.sortBy) {
      ;({ sortBy } = customGroup)
    }
  }

  return {
    options: {
      ...baseCompareOptions,
      fallbackSort: {
        ...baseCompareOptions.fallbackSort,
        sortBy: fallbackSortBy,
      },
      sortBy,
    },
    fallbackSortNodeValueGetter: fallbackSortBy
      ? buildNodeValueGetter(fallbackSortBy)
      : null,
    nodeValueGetter: buildNodeValueGetter(sortBy),
  }
}
