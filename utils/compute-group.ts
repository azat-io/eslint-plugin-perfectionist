import type {
  CustomGroupsOption,
  AnyOfCustomGroup,
  GroupsOptions,
} from '../types/common-options'

import { computeGroupsNames } from './compute-groups-names'

/**
 * Parameters for computing the group of an element.
 *
 * @template SingleCustomGroup - Type of individual custom group configuration.
 */
interface GetGroupParameters<SingleCustomGroup> {
  /** Configuration options for grouping. */
  options: {
    /** Custom group definitions. */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Available groups and their order. Can be a flat array or nested arrays
     * for advanced configurations.
     */
    groups: GroupsOptions<string>
  }

  /**
   * Optional function to test if an element matches a custom group.
   *
   * @param customGroup - Custom group configuration to test against.
   * @returns True if the element matches the custom group.
   */
  customGroupMatcher?(
    customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup,
  ): boolean

  /**
   * List of predefined groups that the element belongs to. These are checked
   * after custom groups as a fallback.
   */
  predefinedGroups: string[]
}

/**
 * Determines which group an element belongs to based on custom and predefined
 * groups.
 *
 * The function checks groups in the following priority order:
 *
 * 1. Custom groups (if defined) - checked first, highest priority
 * 2. Predefined groups - checked as fallback
 * 3. Returns 'unknown' if no matching group is found.
 *
 * Only groups that exist in options.groups are considered valid.
 *
 * @example
 *   const group = computeGroup({
 *     options: {
 *       groups: ['react', 'external', 'internal'],
 *       customGroups: [{ groupName: 'react', anyOf: ['react', 'react-*'] }],
 *     },
 *     customGroupMatcher: customGroup => customGroup.anyOf.includes('react'),
 *     predefinedGroups: ['external'],
 *     name: 'react-dom',
 *   })
 *   // Returns: 'react'
 *
 * @template SingleCustomGroup - Type of individual custom group configuration.
 * @param params - Parameters for group computation.
 * @param params.options - Configuration with available groups and custom
 *   groups.
 * @param params.customGroupMatcher - Optional matcher function for custom
 *   groups.
 * @param params.predefinedGroups - Fallback predefined groups to check.
 * @returns The matched group name or 'unknown' if no group matches.
 */
export function computeGroup<SingleCustomGroup>({
  customGroupMatcher,
  predefinedGroups,
  options,
}: GetGroupParameters<SingleCustomGroup>): 'unknown' | string {
  let group: undefined | string
  // For lookup performance.
  let groupsSet = new Set(computeGroupsNames(options.groups))

  /**
   * Attempts to set the group if it's valid and not already set.
   *
   * @param value - Group name(s) to define.
   * @returns True if the group was successfully defined, false otherwise.
   */
  function defineGroup(value: string[] | string): boolean {
    if (Array.isArray(value)) {
      return value.some(defineGroup)
    }
    if (group || !groupsSet.has(value)) {
      return false
    }
    group = value
    return true
  }

  for (let customGroup of options.customGroups) {
    if (customGroupMatcher?.(customGroup)) {
      let groupDefined = defineGroup(customGroup.groupName)
      if (groupDefined) {
        break
      }
    }
  }

  defineGroup(predefinedGroups)

  return group ?? 'unknown'
}
