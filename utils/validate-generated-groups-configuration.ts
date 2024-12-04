import { validateNoDuplicatedGroups } from './validate-groups-configuration'

interface Props {
  customGroups: Record<string, string[] | string> | BaseCustomGroup[]
  groups: (string[] | string)[]
  selectors: string[]
  modifiers: string[]
}

interface BaseCustomGroup {
  groupName: string
}

export let validateGeneratedGroupsConfiguration = ({
  customGroups,
  selectors,
  modifiers,
  groups,
}: Props): void => {
  let availableCustomGroupNames = new Set(
    Array.isArray(customGroups)
      ? customGroups.map(customGroup => customGroup.groupName)
      : Object.keys(customGroups),
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
