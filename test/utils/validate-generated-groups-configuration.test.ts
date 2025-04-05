import { describe, expect, it } from 'vitest'

import { validateGeneratedGroupsConfiguration } from '../../utils/validate-generated-groups-configuration'
import { getArrayCombinations } from '../../utils/get-array-combinations'

describe('validate-generated-groups-configuration', () => {
  let selectors = [
    'selector1',
    'selector2',
    'selector3',
    'double-selector',
    'three-word-selector',
  ]
  let modifiers = ['modifier1', 'modifier2', 'modifier3']

  it('allows predefined groups', () => {
    let allModifierCombinationPermutations =
      getAllNonEmptyCombinations(modifiers)
    let allPredefinedGroups = [
      ...selectors.flatMap(selector =>
        allModifierCombinationPermutations.map(
          modifiersCombinations =>
            `${modifiersCombinations.join('-')}-${selector}`,
        ),
      ),
      ...selectors,
    ]
    expect(() =>
      validateGeneratedGroupsConfiguration({
        options: {
          groups: allPredefinedGroups,
          customGroups: [],
        },
        selectors,
        modifiers,
      }),
    ).not.toThrow()
  })

  it('allows custom groups', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        options: {
          customGroups: [
            {
              groupName: 'myCustomGroup',
            },
          ],
          groups: ['modifier1-selector1', 'myCustomGroup'],
        },
        selectors,
        modifiers,
      }),
    ).not.toThrow()
  })

  it('throws an error with predefined groups with duplicate modifiers', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        options: {
          groups: ['modifier1-modifier1-selector1'],
          customGroups: [],
        },
        selectors,
        modifiers,
      }),
    ).toThrow('Invalid group(s): modifier1-modifier1-selector1')
  })

  it('throws an error if a duplicate group is provided', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        options: {
          groups: ['modifier1-selector1', 'modifier1-selector1'],
          customGroups: [],
        },
        selectors,
        modifiers,
      }),
    ).toThrow('Duplicated group(s): modifier1-selector1')
  })

  it('throws an error if invalid groups are provided', () => {
    expect(() =>
      validateGeneratedGroupsConfiguration({
        options: {
          customGroups: [
            {
              groupName: 'myCustomGroupNotReferenced',
            },
          ],
          groups: ['modifier1-selector1', 'myCustomGroup', ''],
        },
        selectors,
        modifiers,
      }),
    ).toThrow('Invalid group(s): myCustomGroup')
  })

  it('throws an error with consecutive newlines objects', () => {
    expect(() => {
      validateGeneratedGroupsConfiguration({
        options: {
          groups: [
            { newlinesBetween: 'always' },
            { newlinesBetween: 'always' },
          ],
          customGroups: [],
        },
        selectors: [],
        modifiers: [],
      })
    }).toThrow("Consecutive 'newlinesBetween' objects are not allowed")
  })
})

let getAllNonEmptyCombinations = (array: string[]): string[][] => {
  let result: string[][] = []
  for (let i = 1; i < array.length; i++) {
    result = [...result, ...getArrayCombinations(array, i)]
  }
  return result
}
