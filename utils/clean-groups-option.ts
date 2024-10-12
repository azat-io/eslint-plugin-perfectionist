interface GroupOptions {
  groups: (string[] | string)[]
}

export const cleanGroupsOption = <T extends GroupOptions>(options: T): T => ({
  ...options,
  groups: options.groups
    .filter(group => group.length > 0)
    .map(group =>
      typeof group === 'string' ? group : getCleanedNestedGroups(group),
    ),
})

const getCleanedNestedGroups = (nestedGroup: string[]): string[] | string =>
  nestedGroup.length === 1 ? nestedGroup[0] : nestedGroup
