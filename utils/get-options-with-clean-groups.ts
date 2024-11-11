interface GroupOptions {
  groups: (string[] | string)[]
}

export let getOptionsWithCleanGroups = <T extends GroupOptions>(
  options: T,
): T => ({
  ...options,
  groups: options.groups
    .filter(group => group.length > 0)
    .map(group =>
      typeof group === 'string' ? group : getCleanedNestedGroups(group),
    ),
})

let getCleanedNestedGroups = (nestedGroup: string[]): string[] | string =>
  nestedGroup.length === 1 ? nestedGroup[0] : nestedGroup
