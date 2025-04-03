import type {
  DeprecatedCustomGroupsOption,
  NewlinesBetweenOption,
} from '../types/common-options'

import { matches } from './matches'

interface UseGroupsValue {
  setCustomGroups(
    customGroups: DeprecatedCustomGroupsOption | undefined,
    name: string,
  ): void
  defineGroup(value: string): void
  getGroup(): string
}

interface UseGroupParameters {
  groups: ({ newlinesBetween: NewlinesBetweenOption } | string[] | string)[]
}

/**
 * Functions to set and define groups
 * @deprecated for computeGroups function
 * @param {object} params - The parameters for the operation
 * @param {string[]} params.groups - groups array
 * @returns {UseGroupsValue} functions to set and define groups
 */
export let useGroups = ({ groups }: UseGroupParameters): UseGroupsValue => {
  let group: undefined | string
  // For lookup performance.
  let groupsSet = new Set(groups.flat())

  let defineGroup = (value: string): void => {
    if (!group && groupsSet.has(value)) {
      group = value
    }
  }

  let setCustomGroups = (
    customGroups: DeprecatedCustomGroupsOption | undefined,
    name: string,
  ): void => {
    if (!customGroups) {
      return
    }

    for (let [key, pattern] of Object.entries(customGroups)) {
      if (matches(name, pattern)) {
        defineGroup(key)
      }
    }
  }

  return {
    getGroup: () => group ?? 'unknown',
    setCustomGroups,
    defineGroup,
  }
}
