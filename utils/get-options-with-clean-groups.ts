import type { GroupsOptions } from '../types/common-groups-options'

/**
 * Parameters for cleaning and normalizing groups configuration.
 *
 * Contains the groups array that needs to be cleaned up.
 */
interface GetOptionsWithCleanGroupsParameters<CustomTypeOption extends string> {
  /**
   * Groups configuration that may contain empty arrays or single-element
   * arrays.
   */
  groups: GroupsOptions<CustomTypeOption>
}

/**
 * Cleans and normalizes the groups configuration in options.
 *
 * Performs the following optimizations on the groups array:
 *
 * - Removes empty arrays (they serve no purpose in grouping)
 * - Converts single-element arrays to plain strings (simplifies structure)
 * - Preserves multi-element arrays as-is (maintains subgroups).
 *
 * This normalization ensures consistent group handling and eliminates
 * unnecessary complexity in the configuration.
 *
 * @example
 *
 * ```ts
 * getOptionsWithCleanGroups({
 *   groups: [
 *     'imports',
 *     ['types'], // Single element - will become 'types'
 *     ['hooks', 'utils'], // Multiple elements - preserved as array
 *     [], // Empty - will be removed
 *     'components',
 *   ],
 * })
 * // Returns: {
 * //   groups: [
 * //     'imports',
 * //     'types',
 * //     ['hooks', 'utils'],
 * //     'components'
 * //   ]
 * // }
 * ```
 *
 * @template CustomTypeOption - Custom type option string for GroupsOptions.
 * @template Options - Type of options extending
 *   GetOptionsWithCleanGroupsParameters.
 * @param options - Options object containing groups to clean.
 * @returns Options with cleaned and normalized groups array.
 */
export function getOptionsWithCleanGroups<
  CustomTypeOption extends string,
  Options extends GetOptionsWithCleanGroupsParameters<CustomTypeOption>,
>(options: Options): Options {
  return {
    ...options,
    groups: options.groups
      .filter(group => !Array.isArray(group) || group.length > 0)
      .map(group =>
        Array.isArray(group) ? getCleanedNestedGroups(group) : group,
      ),
  }
}

/**
 * Simplifies a nested group array by converting single-element arrays to
 * strings.
 *
 * Helper function that normalizes array groups:
 *
 * - Single-element arrays are unwrapped to plain strings
 * - Multi-element arrays are preserved as-is
 * - Empty single-element arrays remain as arrays.
 *
 * @example
 *
 * ```ts
 * getCleanedNestedGroups(['types']) // Returns: 'types'
 * getCleanedNestedGroups(['a', 'b']) // Returns: ['a', 'b']
 * getCleanedNestedGroups(['']) // Returns: ['']
 * ```
 *
 * @param nestedGroup - Array of group names to potentially simplify.
 * @returns Simplified string if single non-empty element, otherwise the
 *   original array.
 */
function getCleanedNestedGroups(nestedGroup: string[]): string[] | string {
  return nestedGroup.length === 1 && nestedGroup[0] ?
      nestedGroup[0]
    : nestedGroup
}
