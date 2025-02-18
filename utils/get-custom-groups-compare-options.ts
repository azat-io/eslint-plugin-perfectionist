import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  GroupsOptions,
  CommonOptions,
} from '../types/common-options'

type BaseOptions = {
  customGroups: DeprecatedCustomGroupsOption | CustomGroupsOption
  groups: GroupsOptions<string>
} & CommonOptions

/**
 * Retrieves the compare options used to sort a given group. If the group is a
 * custom group, its options will be favored over the default options. Returns
 * `null` if the group should not be sorted.
 * @param {BaseOptions} options - The sorting options, including groups and
 * custom groups.
 * @param {number} groupNumber - The index of the group to retrieve compare
 * options for.
 * @returns {BaseOptions} The options for the group
 */
export let getCustomGroupsCompareOptions = <Options extends BaseOptions>(
  options: Options,
  groupNumber: number,
): Options => {
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
