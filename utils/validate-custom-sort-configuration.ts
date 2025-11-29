import type {
  CommonGroupsOptions,
  GroupsOptions,
} from '../types/common-groups-options'
import type { CommonOptions } from '../types/common-options'

import { isGroupWithOverridesOption } from './is-group-with-overrides-option'

/** Options for custom sort configuration validation. */
type Options = {
  groups?: CommonGroupsOptions<unknown>['groups']
} & Pick<CommonOptions, 'alphabet' | 'type'>

/**
 * Validates configuration when using custom sort type.
 *
 * Ensures that when a user selects 'custom' sorting type, they provide a valid
 * alphabet string. This prevents runtime errors and ensures the custom sorting
 * has a defined order to follow.
 *
 * The function is called at the beginning of every sorting rule's execution to
 * catch configuration errors early and provide clear error messages.
 *
 * @param options - Configuration options to validate.
 * @throws {Error} If type is 'custom' but alphabet is empty.
 */
export function validateCustomSortConfiguration(options: Options): void {
  if (!usesCustomSort(options)) {
    return
  }

  if (options.alphabet.length === 0) {
    throw new Error('`alphabet` option must not be empty')
  }
}

function usesCustomSortInGroups(groups: GroupsOptions | undefined): boolean {
  if (!groups) {
    return false
  }

  return groups
    .filter(isGroupWithOverridesOption)
    .some(groupWithSettings => groupWithSettings.type === 'custom')
}

function usesCustomSort(options: Options): boolean {
  if (options.type === 'custom') {
    return true
  }

  return usesCustomSortInGroups(options.groups)
}
