import type {
  GroupCommentAboveOption,
  GroupsOptions,
} from '../types/common-options'

/**
 * Type guard to check if a group option is a comment-above configuration.
 *
 * Determines whether a group element contains a `commentAbove` property, which
 * indicates it's a special configuration object that adds a comment above the
 * group rather than being a regular group name or newlines option.
 *
 * Comment-above options are used to automatically insert separator comments
 * between code sections during sorting operations.
 *
 * @example
 *   const groups = [
 *     'imports',
 *     { commentAbove: '// Components' },
 *     'components',
 *     { newlinesBetween: 1 },
 *     'utils',
 *   ]
 *
 *   isCommentAboveOption(groups[0]) // false (string)
 *   isCommentAboveOption(groups[1]) // true (has commentAbove)
 *   isCommentAboveOption(groups[3]) // false (newlines option)
 *
 * @param groupOption - A single element from the groups configuration array.
 * @returns True if the element is a comment-above configuration object.
 */
export function isCommentAboveOption(
  groupOption: GroupsOptions<string>[number],
): groupOption is GroupCommentAboveOption {
  return typeof groupOption === 'object' && 'commentAbove' in groupOption
}
