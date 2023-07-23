export let useGroups = (groups: (string[] | string)[]) => {
  let group: undefined | string

  let defineGroup = (value: string) => {
    if (!group && groups.flat().includes(value)) {
      group = value
    }
  }

  return {
    getGroup: () => group ?? 'unknown',
    defineGroup,
  }
}
