import type { GroupsOptions } from '../types/common-options'

interface GetOptionsWithCleanGroupsParameters {
  groups: GroupsOptions<string>
}

export function getOptionsWithCleanGroups<
  T extends GetOptionsWithCleanGroupsParameters,
>(options: T): T {
  return {
    ...options,
    groups: options.groups
      .filter(group => !Array.isArray(group) || group.length > 0)
      .map(group =>
        Array.isArray(group) ? getCleanedNestedGroups(group) : group,
      ),
  }
}

function getCleanedNestedGroups(nestedGroup: string[]): string[] | string {
  return nestedGroup.length === 1 && nestedGroup[0]
    ? nestedGroup[0]
    : nestedGroup
}
