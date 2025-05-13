import type {
  GroupNewlinesBetweenOption,
  GroupsOptions,
} from '../types/common-options'

export let isNewlinesBetweenOption = (
  groupOption: GroupsOptions<string>[number],
): groupOption is GroupNewlinesBetweenOption =>
  typeof groupOption === 'object' && 'newlinesBetween' in groupOption
