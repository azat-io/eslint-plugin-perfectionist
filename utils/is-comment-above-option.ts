import type {
  GroupCommentAboveOption,
  GroupsOptions,
} from '../types/common-options'

export let isCommentAboveOption = (
  groupOption: GroupsOptions<string>[number],
): groupOption is GroupCommentAboveOption =>
  typeof groupOption === 'object' && 'commentAbove' in groupOption
