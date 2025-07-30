import type {
  GroupNewlinesBetweenOption,
  GroupsOptions,
} from '../types/common-options'

export function isNewlinesBetweenOption(
  groupOption: GroupsOptions<string>[number],
): groupOption is GroupNewlinesBetweenOption {
  return typeof groupOption === 'object' && 'newlinesBetween' in groupOption
}
