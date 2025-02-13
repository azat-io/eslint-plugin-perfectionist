import type { SortObjectTypesSortingNode, Options } from './types'
import type { CompareOptions } from '../../utils/compare'

import { buildNodeValueGetter } from './build-node-value-getter'

export let getCustomGroupsCompareOptions = (
  options: Required<Options[0]>,
  groupNumber: number,
): CompareOptions<SortObjectTypesSortingNode> & Required<Options[0]> => {
  if (!Array.isArray(options.customGroups)) {
    return options
  }
  let group = options.groups[groupNumber]
  let customGroup =
    typeof group === 'string'
      ? options.customGroups.find(
          currentGroup => group === currentGroup.groupName,
        )
      : null

  let sortBy =
    customGroup && 'sortBy' in customGroup ? customGroup.sortBy : options.sortBy
  sortBy ??= options.sortBy

  return {
    ...options,
    nodeValueGetter: buildNodeValueGetter(sortBy),
    order: customGroup?.order ?? options.order,
    type: customGroup?.type ?? options.type,
    sortBy,
  }
}
