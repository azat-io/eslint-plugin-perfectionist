import type { NodeValueGetterFunction } from '../../utils/compare'
import type { SortObjectTypesSortingNode, Options } from './types'

import { getCustomGroupsCompareOptions as baseGetCustomGroupsCompareOptions } from '../../utils/get-custom-groups-compare-options'
import { buildNodeValueGetter } from './build-node-value-getter'

type InputOptions = Pick<
  Required<Options[0]>,
  'fallbackSort' | 'customGroups' | 'sortBy' | 'groups' | 'order' | 'type'
>

export let getCustomGroupsCompareOptions = (
  options: InputOptions,
  groupNumber: number,
): {
  options: Pick<
    Required<Options[0]>,
    'fallbackSort' | 'sortBy' | 'order' | 'type'
  >
  fallbackSortNodeValueGetter?: NodeValueGetterFunction<SortObjectTypesSortingNode> | null
  nodeValueGetter?: NodeValueGetterFunction<SortObjectTypesSortingNode> | null
} => {
  let baseCompareOptions = baseGetCustomGroupsCompareOptions(
    options,
    groupNumber,
  )

  let { fallbackSort, customGroups, sortBy, groups } = options
  let fallbackSortBy = fallbackSort.sortBy
  if (Array.isArray(customGroups)) {
    let group = groups[groupNumber]
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
