import { describe, expect, it } from 'vitest'

import { validateGeneratedGroupsConfiguration } from '../../utils/validate-generated-groups-configuration'
import { allModifiers, allSelectors } from '../../rules/sort-classes/types'
import { getArrayCombinations } from '../../utils/get-array-combinations'

describe('validate-generated-groups-configuration', () => {
  it('allows predefined groups', () => {
    let allModifierCombinationPermutations =
      getAllNonEmptyCombinations(allModifiers)
    let allPredefinedGroups = [
      ...allSelectors.flatMap(selector =>
        allModifierCombinationPermutations.map(
          modifiers => `${modifiers.join('-')}-${selector}`,
        ),
      ),
      ...allSelectors,
    ]
    expect(() =>
      validateGeneratedGroupsConfiguration({
        groups: allPredefinedGroups,
        selectors: allSelectors,
        modifiers: allModifiers,
        customGroups: [],
      }),
    ).not.toThrow()
  })

  it('allows custom groups', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        customGroups: [
          {
            groupName: 'myCustomGroup',
          },
        ],
        groups: ['static-property', 'myCustomGroup'],
        selectors: allSelectors,
        modifiers: allModifiers,
      }),
    ).not.toThrow()
  })

  it('throws an error with predefined groups with duplicate modifiers', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        groups: ['static-static-property'],
        selectors: allSelectors,
        modifiers: allModifiers,
        customGroups: [],
      }),
    ).toThrow('Invalid group(s): static-static-property')
  })

  it('throws an error if a duplicate group is provided', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        groups: ['static-property', 'static-property'],
        selectors: allSelectors,
        modifiers: allModifiers,
        customGroups: [],
      }),
    ).toThrow('Duplicated group(s): static-property')
  })

  it('throws an error if invalid groups are provided', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        customGroups: [
          {
            groupName: 'myCustomGroupNotReferenced',
          },
        ],
        groups: ['static-property', 'myCustomGroup', ''],
        selectors: allSelectors,
        modifiers: allModifiers,
      }),
    ).toThrow('Invalid group(s): myCustomGroup')
  })
})

let getAllNonEmptyCombinations = (array: string[]): string[][] => {
  let result: string[][] = []
  for (let i = 1; i < array.length; i++) {
    result = [...result, ...getArrayCombinations(array, i)]
  }
  return result
}
