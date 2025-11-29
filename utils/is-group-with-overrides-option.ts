import type {
  GroupWithOverridesOption,
  GroupsOptions,
} from '../types/common-options'

/**
 * Type guard to check if a group option is a group with overrides
 * configuration.
 *
 * Determines whether a group element is a special configuration object that
 * contains group settings rather than being a regular group name or newlines
 * option.
 *
 * @example
 *   const groups = [
 *     'imports',
 *     { group: 'foo', commentAbove: '// Components' },
 *     'components',
 *     { newlinesBetween: 1 },
 *     'utils',
 *   ]
 *
 *   isGroupWithOverridesOption(groups[0]) // false (string)
 *   isGroupWithOverridesOption(groups[1]) // true
 *   isGroupWithOverridesOption(groups[3]) // false (newlines option)
 *
 * @param groupOption - A single element from the groups configuration array.
 * @returns True if the element is a group with overrides configuration object.
 */
export function isGroupWithOverridesOption(
  groupOption: GroupsOptions[number],
): groupOption is GroupWithOverridesOption {
  return typeof groupOption === 'object' && 'group' in groupOption
}
