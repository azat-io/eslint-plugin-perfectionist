import type { GroupsOptions } from '../types/common-options'

export let isCommentAboveOption = (
  groupOption: GroupsOptions<string>[number],
): groupOption is { commentAbove: string } =>
  typeof groupOption === 'object' && 'commentAbove' in groupOption
