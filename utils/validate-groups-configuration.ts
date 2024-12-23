type Group =
  | { newlinesBetween: 'ignore' | 'always' | 'never' }
  | string[]
  | string

/**
 * Throws an error if one of the following conditions is met:
 * - One or more groups specified in `groups` are not predefined nor specified
 * in `customGroups`
 * - A group is specified in `groups` more than once
 * @param {Group[]} groups - The groups to validate.
 * @param {string[]} allowedPredefinedGroups - An array of predefined group
 * names that are considered valid.
 * @param {string[]} allowedCustomGroups - An array of custom group names that
 * are considered valid.
 * @throws Will throw an error if invalid or duplicated groups are found.
 */
export let validateGroupsConfiguration = (
  groups: Group[],
  allowedPredefinedGroups: string[],
  allowedCustomGroups: string[],
): void => {
  let allowedGroupsSet = new Set([
    ...allowedPredefinedGroups,
    ...allowedCustomGroups,
  ])
  let invalidGroups: string[] = []
  let isPreviousElementNewlinesBetween = false
  for (let groupElement of groups) {
    if (typeof groupElement === 'object' && 'newlinesBetween' in groupElement) {
      // There should not be two consecutive `newlinesBetween` objects
      if (isPreviousElementNewlinesBetween) {
        throw new Error("Consecutive 'newlinesBetween' objects are not allowed")
      }
      isPreviousElementNewlinesBetween = true
    } else {
      isPreviousElementNewlinesBetween = false
      let groupElements = Array.isArray(groupElement)
        ? groupElement
        : [groupElement]
      for (let group of groupElements) {
        if (!allowedGroupsSet.has(group)) {
          invalidGroups.push(group)
        }
      }
    }
  }
  if (invalidGroups.length) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(groups)
}

/**
 * Throws an error if a group is specified more than once
 * @param {Group[]} groups - The groups to check for duplicates.
 * @throws Will throw an error if duplicated groups are found.
 */
export let validateNoDuplicatedGroups = (groups: Group[]): void => {
  let flattenGroups = groups.flat()
  let seenGroups = new Set<string>()
  let duplicatedGroups = new Set<string>()

  for (let group of flattenGroups) {
    if (typeof group === 'object' && 'newlinesBetween' in group) {
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
