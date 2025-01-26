import type {
  NewlinesBetweenOption,
  GroupsOptions,
} from '../types/common-options'

export let isNewlinesBetweenOption = (
  groupOption: GroupsOptions<string>[number],
): groupOption is { newlinesBetween: NewlinesBetweenOption } =>
  typeof groupOption === 'object' && 'newlinesBetween' in groupOption
