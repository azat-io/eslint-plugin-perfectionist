import type { GroupsOptions } from '../types/common-options'

interface GetOptionsWithCleanGroupsParameters {
  groups: GroupsOptions<string>
}

export let getOptionsWithCleanGroups = <
  T extends GetOptionsWithCleanGroupsParameters,
>(
  options: T,
): T => ({
  ...options,
  groups: options.groups
    .filter(group => !Array.isArray(group) || group.length > 0)
    .map(group =>
      Array.isArray(group) ? getCleanedNestedGroups(group) : group,
    ),
})

let getCleanedNestedGroups = (nestedGroup: string[]): string[] | string =>
  nestedGroup.length === 1 && nestedGroup[0] ? nestedGroup[0] : nestedGroup
