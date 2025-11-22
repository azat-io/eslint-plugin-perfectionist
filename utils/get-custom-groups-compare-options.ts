import type {
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
} from '../types/common-options'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'
import { computeGroupName } from './compute-group-name'

/**
 * Options related to group configuration.
 *
 * Contains the groups configuration and custom groups definitions that
 * determine how elements are categorized and sorted.
 */
interface GroupRelatedOptions {
  /** Custom groups configuration. */
  customGroups: CustomGroupsOption

  /** Groups configuration defining available groups and their order. */
  groups: GroupsOptions<string>
}

/**
 * Sorting options that can be overridden at the custom group level.
 *
 * These options can be specified globally and then overridden for specific
 * custom groups to provide fine-grained control over sorting behavior.
 */
type OverridableOptions = Pick<CommonOptions, 'fallbackSort' | 'order' | 'type'>

/**
 * Retrieves the compare options used to sort a given group. If the group is a
 * custom group, its options will be favored over the default options. Returns
 * `null` if the group should not be sorted.
 *
 * @param options - The sorting options, including groups and custom groups.
 * @param groupIndex - The index of the group to retrieve compare options for.
 * @returns The options for the group.
 */
/**
 * Retrieves sorting options potentially overridden by a custom group or group
 * with settings configuration.
 *
 * Checks if the group at the specified index is a custom group with its own
 * sorting configuration. If so, returns the overridden options (type, order,
 * fallbackSort). Otherwise, returns the original options.
 *
 * Custom groups can override:
 *
 * - Sort type (e.g., use 'natural' instead of global 'alphabetical')
 * - Sort order (e.g., use 'desc' instead of global 'asc')
 * - Fallback sort configuration.
 *
 * @example
 *   const options = {
 *     type: 'alphabetical',
 *     order: 'asc',
 *     fallbackSort: { type: 'natural' },
 *     groups: ['custom-group', 'other'],
 *     customGroups: [
 *       {
 *         groupName: 'custom-group',
 *         type: 'natural',
 *         order: 'desc',
 *       },
 *     ],
 *   }
 *   const overridden = getCustomGroupsCompareOptions(options, 0)
 *   // Returns: { type: 'natural', order: 'desc', fallbackSort: { type: 'natural' } }
 *
 * @param options - Combined group and sorting options.
 * @param groupIndex - Index of the group to check for overrides.
 * @returns Sorting options, potentially overridden by custom group
 *   configuration.
 */
export function getCustomGroupsCompareOptions(
  options: GroupRelatedOptions & OverridableOptions,
  groupIndex: number,
): OverridableOptions {
  let { customGroups, fallbackSort, groups, order, type } = options

  let group = groups[groupIndex]
  let groupName = group ? computeGroupName(group) : null
  let customGroup = customGroups.find(
    currentGroup => groupName === currentGroup.groupName,
  )

  if (group && isGroupWithOverridesOption(group)) {
    type = group.type ?? type
    order = group.order ?? order
  }

  if (customGroup) {
    fallbackSort = {
      type: customGroup.fallbackSort?.type ?? fallbackSort.type,
    }
    let fallbackOrder = customGroup.fallbackSort?.order ?? fallbackSort.order
    if (fallbackOrder) {
      fallbackSort.order = fallbackOrder
    }
    order = customGroup.order ?? order
    type = customGroup.type ?? type
  }

  return {
    fallbackSort,
    order,
    type,
  }
}

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
 *     buildGetCustomGroupOverriddenOptionsFunction(options)
 *   const group1Options = getOverriddenOptions(0)
 *   const group2Options = getOverriddenOptions(1)
 *
 * @param options - Base sorting options with group configuration.
 * @returns Function that takes a group index and returns overridden options.
 */
export function buildGetCustomGroupOverriddenOptionsFunction(
  options: GroupRelatedOptions & CommonOptions,
): (groupIndex: number) => {
  options: CommonOptions
} {
  return (groupIndex: number) => ({
    options: getCustomGroupOverriddenOptions({
      groupIndex,
      options,
    }),
  })
}

/**
 * Gets complete sorting options with custom group overrides applied.
 *
 * Merges the base sorting options with any overrides specified for the custom
 * group at the given index. This ensures that custom groups can have their own
 * sorting behavior while inheriting non-overridden options from the base
 * configuration.
 *
 * @param params - Parameters object.
 * @param params.options - Base sorting options with group configuration.
 * @param params.groupIndex - Index of the group to check for overrides.
 * @returns Complete sorting options with custom group overrides applied.
 */
export function getCustomGroupOverriddenOptions({
  groupIndex,
  options,
}: {
  options: GroupRelatedOptions & CommonOptions
  groupIndex: number
}): CommonOptions {
  return {
    ...options,
    ...getCustomGroupsCompareOptions(options, groupIndex),
  }
}
