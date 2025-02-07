import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'

import { validateNoDuplicatedGroups } from './validate-no-duplicated-groups'

interface ValidateGenerateGroupsConfigurationParameters {
  options: {
    customGroups: DeprecatedCustomGroupsOption | CustomGroupsOption
    groups: GroupsOptions<string>
  }
  selectors: string[]
  modifiers: string[]
}

export let validateGeneratedGroupsConfiguration = ({
  selectors,
  modifiers,
  options,
}: ValidateGenerateGroupsConfigurationParameters): void => {
  let availableCustomGroupNames = new Set(
    Array.isArray(options.customGroups)
      ? options.customGroups.map(customGroup => customGroup.groupName)
      : Object.keys(options.customGroups),
  )
  let invalidGroups = options.groups
    .flat()
    .filter(group => typeof group === 'string')
    .filter(
      group =>
        !isPredefinedGroup(selectors, modifiers, group) &&
        !availableCustomGroupNames.has(group),
    )
  if (invalidGroups.length > 0) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(options)
}

let isPredefinedGroup = (
  allSelectors: string[],
  allModifiers: string[],
  input: string,
): boolean => {
  if (input === 'unknown') {
    return true
  }
  let singleWordSelector = input.split('-').at(-1)
  if (!singleWordSelector) {
    return false
  }
  let twoWordsSelector = input.split('-').slice(-2).join('-')
  let isTwoWordSelectorValid = allSelectors.includes(twoWordsSelector)
  if (!allSelectors.includes(singleWordSelector) && !isTwoWordSelectorValid) {
    return false
  }
  let modifiers = input.split('-').slice(0, isTwoWordSelectorValid ? -2 : -1)
  return (
    new Set(modifiers).size === modifiers.length &&
    modifiers.every(modifier => allModifiers.includes(modifier))
  )
}
