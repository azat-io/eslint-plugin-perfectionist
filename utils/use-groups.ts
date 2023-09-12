import { minimatch } from 'minimatch'

export let useGroups = (groups: (string[] | string)[]) => {
  let group: undefined | string

  let defineGroup = (value: string) => {
    if (!group && groups.flat().includes(value)) {
      group = value
    }
  }

  let setCustomGroups = (
    customGroups:
      | {
          [key: string]: string[] | string
        }
      | undefined,
    name: string,
  ) => {
    if (customGroups) {
      for (let [key, pattern] of Object.entries(customGroups)) {
        if (
          Array.isArray(pattern) &&
          pattern.some(patternValue =>
            minimatch(name, patternValue, {
              nocomment: true,
            }),
          )
        ) {
          defineGroup(key)
        }

        if (
          typeof pattern === 'string' &&
          minimatch(name, pattern, {
            nocomment: true,
          })
        ) {
          defineGroup(key)
        }
      }
    }
  }

  return {
    getGroup: () => group ?? 'unknown',
    setCustomGroups,
    defineGroup,
  }
}
