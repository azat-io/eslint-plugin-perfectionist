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
    -longestAllowedSelector.dashSeparatedElementsCount,
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
      -longestAllowedModifier.dashSeparatedElementsCount,
    )
  }

  return true
}

let computeLongestAllowedWord = ({
  elementsSeparatedWithDash,
  allowThreeWord,
  allowedValues,
}: {
  elementsSeparatedWithDash: string[]
  allowedValues: string[]
  allowThreeWord: boolean
}): { dashSeparatedElementsCount: number; word: string } | null => {
  let singleWordElement = elementsSeparatedWithDash.at(-1)
  if (!singleWordElement) {
    return null
  }
  let twoWordsElement = elementsSeparatedWithDash.slice(-2).join('-')
  let threeWordsElement = elementsSeparatedWithDash.slice(-3).join('-')
  let word: undefined | string

  let dashSeparatedElementsCount = 0
  if (allowedValues.includes(singleWordElement)) {
    dashSeparatedElementsCount = 1
    word = singleWordElement
  }
  if (
    singleWordElement !== twoWordsElement &&
    allowedValues.includes(twoWordsElement)
  ) {
    dashSeparatedElementsCount = 2
    word = twoWordsElement
  }
  if (
    allowThreeWord &&
    twoWordsElement !== threeWordsElement &&
    allowedValues.includes(threeWordsElement)
  ) {
    dashSeparatedElementsCount = 3
    word = threeWordsElement
  }

  if (!dashSeparatedElementsCount || !word) {
    return null
  }

  return { dashSeparatedElementsCount, word }
}
