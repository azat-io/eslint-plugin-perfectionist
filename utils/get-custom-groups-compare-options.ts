import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  GroupsOptions,
  CommonOptions,
} from '../types/common-options'
import type { SortingNode } from '../types/sorting-node'
import type { CompareOptions } from './compare'

type Options = {
  customGroups: DeprecatedCustomGroupsOption | CustomGroupsOption
  groups: GroupsOptions<string>
} & CommonOptions

/**
 * Retrieves the compare options used to sort a given group. If the group is a
 * custom group, its options will be favored over the default options. Returns
 * `null` if the group should not be sorted.
 * @param {Options} options - The sorting options,
 * including groups and custom groups.
 * @param {number} groupNumber - The index of the group to retrieve compare
 * options for.
 * @returns {CompareOptions} The compare options for the group, or `null`
 * if the group should not be sorted.
 */
export let getCustomGroupsCompareOptions = <T extends SortingNode>(
  options: Options,
  groupNumber: number,
): CompareOptions<T> => {
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

  return {
    ...options,
    order: customGroup?.order ?? options.order,
    type: customGroup?.type ?? options.type,
  }
}
