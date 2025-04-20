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

  let elementsSeparatedWithDash = input.split('-')

  let longestAllowedSelector = computeLongestAllowedWord({
    allowedValues: allSelectors,
    elementsSeparatedWithDash,
    allowThreeWord: true,
  })
  if (!longestAllowedSelector) {
    return false
  }

  let modifiersToParse = elementsSeparatedWithDash.slice(
    0,
    -longestAllowedSelector.wordCount,
  )
  let parsedModifiers = new Set<string>()
  while (modifiersToParse.length > 0) {
    let longestAllowedModifier = computeLongestAllowedWord({
      elementsSeparatedWithDash: modifiersToParse,
      allowedValues: allModifiers,
      allowThreeWord: false,
    })
    if (!longestAllowedModifier) {
      return false
    }
    if (parsedModifiers.has(longestAllowedModifier.word)) {
      return false
    }
    parsedModifiers.add(longestAllowedModifier.word)
    modifiersToParse = modifiersToParse.slice(
      0,
      -longestAllowedModifier.wordCount,
    )
  }

  return true
}

let computeLongestAllowedWord = ({
  elementsSeparatedWithDash,
  allowedValues,
}: {
  elementsSeparatedWithDash: string[]
  allowedValues: string[]
  allowThreeWord: boolean
}): { wordCount: number; word: string } | null => {
  let match = [
    { word: elementsSeparatedWithDash.slice(-3).join('-'), wordCount: 3 },
    { word: elementsSeparatedWithDash.slice(-2).join('-'), wordCount: 2 },
    { word: elementsSeparatedWithDash.at(-1)!, wordCount: 1 },
  ]
    .filter(({ wordCount }) => elementsSeparatedWithDash.length >= wordCount)
    .find(({ word }) => word && allowedValues.includes(word))

  if (!match) {
    return null
  }

  return match
}
