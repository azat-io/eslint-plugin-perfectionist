import { matches } from './matches'

interface UseGroupProps {
  matcher: 'minimatch' | 'regex'
  groups: (string[] | string)[]
}

export let useGroups = ({ matcher, groups }: UseGroupProps) => {
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
          pattern.some(patternValue => matches(name, patternValue, matcher))
        ) {
          defineGroup(key, params.override)
        }

        if (typeof pattern === 'string' && matches(name, pattern, matcher)) {
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
