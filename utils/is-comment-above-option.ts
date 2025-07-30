import type {
  GroupCommentAboveOption,
  GroupsOptions,
} from '../types/common-options'

export function isCommentAboveOption(
  groupOption: GroupsOptions<string>[number],
): groupOption is GroupCommentAboveOption {
  return typeof groupOption === 'object' && 'commentAbove' in groupOption
}
