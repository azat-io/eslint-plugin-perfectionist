import type {
  DeprecatedCustomGroupsOption,
  CustomGroupsOption,
  GroupsOptions,
} from '../types/common-options'

import { validateNewlinesBetweenInsideGroups } from './validate-newlines-between-inside-groups'
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
  validateNewlinesBetweenInsideGroups(options)
}

let isPredefinedGroup = (
  allSelectors: string[],
  allModifiers: string[],
  input: string,
): boolean => {
  if (input === 'unknown') {
    return true
  }

  let parts = input.split('-')

  let possibleSelector = [
    { selector: parts.slice(-3).join('-'), wordCount: 3 },
    { selector: parts.slice(-2).join('-'), wordCount: 2 },
    { selector: parts.at(-1), wordCount: 1 },
  ]
    .filter(({ wordCount }) => parts.length >= wordCount)
    .find(({ selector }) => selector && allSelectors.includes(selector))

  if (!possibleSelector) {
    return false
  }

  let modifiers = parts.slice(0, -possibleSelector.wordCount)

  return (
    new Set(modifiers).size === modifiers.length &&
    modifiers.every(modifier => allModifiers.includes(modifier))
  )
}
