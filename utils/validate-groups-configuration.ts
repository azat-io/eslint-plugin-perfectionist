/**
 * Throws an error if one of the following conditions is met:
 * - One or more groups specified in `groups` are not predefined nor specified
 * in `customGroups`
 * - A group is specified in `groups` more than once
 */
export let validateGroupsConfiguration = (
  groups: (string[] | string)[],
  allowedPredefinedGroups: string[],
  allowedCustomGroups: string[],
): void => {
  let allowedGroupsSet = new Set([
    ...allowedPredefinedGroups,
    ...allowedCustomGroups,
  ])
  let invalidGroups = groups
    .flat()
    .filter(group => !allowedGroupsSet.has(group))
  if (invalidGroups.length) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(groups)
}

/**
 * Throws an error if a group is specified more than once
 */
export let validateNoDuplicatedGroups = (
  groups: (string[] | string)[],
): void => {
  let flattenGroups = groups.flat()
  let duplicatedGroups = flattenGroups.filter(
    (group, index) => flattenGroups.indexOf(group) !== index,
  )
  if (duplicatedGroups.length) {
    throw new Error(`Duplicated group(s): ${duplicatedGroups.join(', ')}`)
  }
}
