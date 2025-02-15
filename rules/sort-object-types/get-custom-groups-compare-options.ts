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
  nodeValueGetter?: NodeValueGetterFunction<SortObjectTypesSortingNode> | null
} => {
  let baseCompareOptions = baseGetCustomGroupsCompareOptions(
    options,
    groupNumber,
  )

  let { customGroups, sortBy, groups } = options
  if (Array.isArray(customGroups)) {
    let group = groups[groupNumber]
    let customGroup =
      typeof group === 'string'
        ? customGroups.find(currentGroup => group === currentGroup.groupName)
        : null

    if (customGroup && 'sortBy' in customGroup && customGroup.sortBy) {
      ;({ sortBy } = customGroup)
    }
  }

  return {
    options: {
      ...baseCompareOptions,
      sortBy,
    },
    nodeValueGetter: buildNodeValueGetter(sortBy),
  }
}
