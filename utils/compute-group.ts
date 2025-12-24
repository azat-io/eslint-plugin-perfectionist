import type {
  CommonGroupsOptions,
  AnyOfCustomGroup,
} from '../types/common-groups-options'

import { computeGroupsNames } from './compute-groups-names'

/**
 * Parameters for computing the group of an element.
 *
 * @template SingleCustomGroup - Type of individual custom group configuration.
 */
interface GetGroupParameters<SingleCustomGroup> {
  /** Configuration options for grouping. */
  options: Pick<
    CommonGroupsOptions<SingleCustomGroup, unknown, string>,
    'customGroups' | 'groups'
  >
  /**
   * Optional function to test if an element matches a custom group.
   *
   * @param customGroup - Custom group configuration to test against.
   * @returns True if the element matches the custom group.
   */
  customGroupMatcher: CustomGroupMatcher<SingleCustomGroup>

  /**
   * List of predefined groups that the element belongs to. These are checked
   * after custom groups as a fallback.
   */
  predefinedGroups: string[]
}

type CustomGroupMatcher<SingleCustomGroup> = (
  customGroup: AnyOfCustomGroup<SingleCustomGroup> | SingleCustomGroup,
) => boolean

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
 * @param params.customGroupMatcher - Matcher function for custom groups.
 * @param params.predefinedGroups - Fallback predefined groups to check.
 * @returns The matched group name or 'unknown' if no group matches.
 */
export function computeGroup<SingleCustomGroup>({
  customGroupMatcher,
  predefinedGroups,
  options,
}: GetGroupParameters<SingleCustomGroup>): 'unknown' | string {
  // For lookup performance.
  let groupsSet = new Set(computeGroupsNames(options.groups))

  return (
    computeFirstMatchingCustomGroupName(
      groupsSet,
      options.customGroups,
      customGroupMatcher,
    ) ??
    predefinedGroups.find(group => groupsSet.has(group)) ??
    'unknown'
  )
}

function computeFirstMatchingCustomGroupName<SingleCustomGroup>(
  groupsSet: Set<string>,
  customGroups: CommonGroupsOptions<
    SingleCustomGroup,
    unknown,
    string
  >['customGroups'],
  customGroupMatcher: CustomGroupMatcher<SingleCustomGroup>,
): string | null {
  for (let customGroup of customGroups) {
    if (
      customGroupMatcher(customGroup) &&
      groupsSet.has(customGroup.groupName)
    ) {
      return customGroup.groupName
    }
  }

  return null
}
