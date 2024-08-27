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
    throw new Error('Invalid groups: ' + invalidGroups.join(', '))
  }
}
