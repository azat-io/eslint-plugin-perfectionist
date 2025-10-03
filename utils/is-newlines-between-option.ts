import type {
  GroupNewlinesBetweenOption,
  GroupsOptions,
} from '../types/common-options'

/**
 * Type guard to check if a group option is a newlines-between configuration.
 *
 * Determines whether a group element contains a `newlinesBetween` property,
 * which indicates it's a special configuration object that controls spacing
 * between groups rather than being a regular group name or comment option.
 *
 * Newlines-between options are placed between group names in the configuration
 * to specify how many newlines should separate those groups in the sorted
 * output.
 *
 * @example
 *   const groups = [
 *     'imports',
 *     { newlinesBetween: 1 }, // Add 1 newline between imports and types
 *     'types',
 *     { newlinesBetween: 2 }, // Add 2 newlines between types and components
 *     'components',
 *     { commentAbove: '// Utils' }, // Not a newlines option
 *     'utils',
 *   ]
 *
 *   isNewlinesBetweenOption(groups[0]) // false (string)
 *   isNewlinesBetweenOption(groups[1]) // true (has newlinesBetween)
 *   isNewlinesBetweenOption(groups[3]) // true (has newlinesBetween)
 *   isNewlinesBetweenOption(groups[5]) // false (comment option)
 *
 * @param groupOption - A single element from the groups configuration array.
 * @returns True if the element is a newlines-between configuration object.
 */
export function isNewlinesBetweenOption(
  groupOption: GroupsOptions<string>[number],
): groupOption is GroupNewlinesBetweenOption {
  return typeof groupOption === 'object' && 'newlinesBetween' in groupOption
}
