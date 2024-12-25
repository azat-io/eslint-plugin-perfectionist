import { matches } from './matches'

interface UseGroupsValue {
  setCustomGroups(
    customGroups: Record<string, string[] | string> | undefined,
    name: string,
    parameters?: {
      override?: boolean
    },
  ): void
  defineGroup(value: string, override?: boolean): void
  getGroup(): string
}

interface UseGroupProps {
  groups: (
    | { newlinesBetween: 'ignore' | 'always' | 'never' }
    | string[]
    | string
  )[]
}

export let useGroups = ({ groups }: UseGroupProps): UseGroupsValue => {
  let group: undefined | string
  // For lookup performance.
  let groupsSet = new Set(groups.flat())

  let defineGroup = (value: string, override = false): void => {
    if ((!group || override) && groupsSet.has(value)) {
      group = value
    }
  }

  let setCustomGroups = (
    customGroups: Record<string, string[] | string> | undefined,
    name: string,
    parameters: { override?: boolean } = {},
  ): void => {
    if (customGroups) {
      for (let [key, pattern] of Object.entries(customGroups)) {
        if (
          Array.isArray(pattern) &&
          pattern.some(patternValue => matches(name, patternValue))
        ) {
          defineGroup(key, parameters.override)
        }

        if (typeof pattern === 'string' && matches(name, pattern)) {
          defineGroup(key, parameters.override)
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
