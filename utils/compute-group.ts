import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  AnyOfCustomGroup,
  GroupsOptions,
} from '../types/common-options'

import { matches } from './matches'

/**
 * Parameters for computing the group of an element.
 *
 * @template SingleCustomGroup - Type of individual custom group configuration.
 */
interface GetGroupParameters<SingleCustomGroup> {
  /** Configuration options for grouping. */
  options: {
    /**
     * Custom group definitions. Can be either array-based (with matchers) or
     * object-based (with patterns).
     */
    customGroups?:
      | CustomGroupsOption<SingleCustomGroup>
      | DeprecatedCustomGroupsOption

    /**
     * Available groups and their order. Can be a flat array or nested arrays
     * for advanced configurations.
     */
    groups: GroupsOptions<string>
  }

  /**
   * Optional function to test if an element matches a custom group. Used with
   * array-based custom groups configuration.
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

  /**
   * Optional name of the element. Used for pattern matching with object-based
   * custom groups.
   */
  name?: string
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
 * Custom groups can be configured in two ways:
 *
 * - Array-based: Uses the customGroupMatcher function to test each group
 * - Object-based: Uses pattern matching against the element name.
 *
 * Only groups that exist in options.groups are considered valid.
 *
 * @example
 *   // Array-based custom groups
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
 * @example
 *   // Object-based custom groups (deprecated style)
 *   const group = computeGroup({
 *   options: {
 *   groups: ['utils', 'components'],
 *   customGroups: {
 *   utils: ['src/utils/*'],
 *   components: ['src/components/*']
 *   },
 *   predefinedGroups: [],
 *   name: 'src/utils/helper'
 *   });
 *   // Returns: 'utils'
 *
 * @template SingleCustomGroup - Type of individual custom group configuration.
 * @param params - Parameters for group computation.
 * @param params.options - Configuration with available groups and custom
 *   groups.
 * @param params.customGroupMatcher - Optional matcher function for array-based
 *   custom groups.
 * @param params.predefinedGroups - Fallback predefined groups to check.
 * @param params.name - Optional element name for object-based pattern matching.
 * @returns The matched group name or 'unknown' if no group matches.
 */
export function computeGroup<SingleCustomGroup>({
  customGroupMatcher,
  predefinedGroups,
  options,
  name,
}: GetGroupParameters<SingleCustomGroup>): 'unknown' | string {
  let group: undefined | string
  // For lookup performance.
  let groupsSet = new Set(options.groups.flat())

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

  if (options.customGroups) {
    if (Array.isArray(options.customGroups)) {
      for (let customGroup of options.customGroups) {
        if (customGroupMatcher?.(customGroup)) {
          let groupDefined = defineGroup(customGroup.groupName)
          if (groupDefined) {
            break
          }
        }
      }
    } else if (name) {
      for (let [key, pattern] of Object.entries(options.customGroups)) {
        if (matches(name, pattern)) {
          let groupDefined = defineGroup(key)
          if (groupDefined) {
            break
          }
        }
      }
    }
  }

  defineGroup(predefinedGroups)

  return group ?? 'unknown'
}
