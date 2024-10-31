import { matches } from './matches'

interface UseGroupProps {
  groups: (string[] | string)[]
}

export let useGroups = ({ groups }: UseGroupProps) => {
  let group: undefined | string
  // For lookup performance
  let groupsSet = new Set(groups.flat())

  let defineGroup = (value: string, override = false) => {
    if ((!group || override) && groupsSet.has(value)) {
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
    params: { override?: boolean } = {},
  ) => {
    if (customGroups) {
      for (let [key, pattern] of Object.entries(customGroups)) {
        if (
          Array.isArray(pattern) &&
          pattern.some(patternValue => matches(name, patternValue))
        ) {
          defineGroup(key, params.override)
        }

        if (typeof pattern === 'string' && matches(name, pattern)) {
          defineGroup(key, params.override)
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
