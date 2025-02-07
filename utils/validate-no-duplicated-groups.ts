import type { GroupsOptions } from '../types/common-options'

import { isNewlinesBetweenOption } from './is-newlines-between-option'

/**
 * Throws an error if a group is specified more than once
 * @param {object} parameters - Parameters object.
 * @param {GroupsOptions} parameters.groups - The groups to check for duplicates.
 * @throws Error Will throw an error if duplicated groups are found.
 */
export let validateNoDuplicatedGroups = ({
  groups,
}: {
  groups: GroupsOptions<string>
}): void => {
  let flattenGroups = groups.flat()
  let seenGroups = new Set<string>()
  let duplicatedGroups = new Set<string>()

  for (let group of flattenGroups) {
    if (isNewlinesBetweenOption(group)) {
      continue
    }
    if (seenGroups.has(group)) {
      duplicatedGroups.add(group)
    } else {
      seenGroups.add(group)
    }
  }

  if (duplicatedGroups.size > 0) {
    throw new Error(`Duplicated group(s): ${[...duplicatedGroups].join(', ')}`)
  }
}
