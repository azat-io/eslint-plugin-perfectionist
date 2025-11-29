import type { GroupsOptions } from '../types/common-groups-options'

import { computeGroupsNames } from './compute-groups-names'

/**
 * Throws an error if a group is specified more than once.
 *
 * @param parameters - Parameters object.
 * @param parameters.groups - The groups to check for duplicates.
 * @throws Error Will throw an error if duplicated groups are found.
 */
export function validateNoDuplicatedGroups({
  groups,
}: {
  groups: GroupsOptions
}): void {
  let groupNames = computeGroupsNames(groups)
  let seenGroups = new Set<string>()
  let duplicatedGroups = new Set<string>()

  for (let groupName of groupNames) {
    if (seenGroups.has(groupName)) {
      duplicatedGroups.add(groupName)
    } else {
      seenGroups.add(groupName)
    }
  }

  if (duplicatedGroups.size > 0) {
    throw new Error(`Duplicated group(s): ${[...duplicatedGroups].join(', ')}`)
  }
}
