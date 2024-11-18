import type { Modifier, Selector } from './sort-classes.types'

import { validateNoDuplicatedGroups } from '../utils/validate-groups-configuration'

interface Props {
  customGroups: BaseCustomGroup[]
  groups: (string[] | string)[]
  selectors: string[]
  modifiers: string[]
}

interface BaseCustomGroup {
  groupName: string
}

export let validateGeneratedGroupsConfiguration = ({
  customGroups,
  groups,
  selectors,
  modifiers,
}: Props): void => {
  let availableCustomGroupNames = new Set(
    customGroups.map(customGroup => customGroup.groupName),
  )
  let invalidGroups = groups
    .flat()
    .filter(
      group =>
        !isPredefinedGroup(selectors, modifiers, group) &&
        !availableCustomGroupNames.has(group),
    )
  if (invalidGroups.length) {
    throw new Error(`Invalid group(s): ${invalidGroups.join(', ')}`)
  }
  validateNoDuplicatedGroups(groups)
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
  let isTwoWordSelectorValid = allSelectors.includes(
    twoWordsSelector as Selector,
  )
  if (
    !allSelectors.includes(singleWordSelector as Selector) &&
    !isTwoWordSelectorValid
  ) {
    return false
  }
  let modifiers = input.split('-').slice(0, isTwoWordSelectorValid ? -2 : -1)
  return (
    new Set(modifiers).size === modifiers.length &&
    modifiers.every(modifier => allModifiers.includes(modifier as Modifier))
  )
}
