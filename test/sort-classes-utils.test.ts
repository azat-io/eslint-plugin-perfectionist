import { describe, expect, it } from 'vitest'

import {
  validateGroupsConfiguration,
  generateOfficialGroups,
  getCombinations,
} from '../rules/sort-classes-utils'
import { allModifiers, allSelectors } from '../rules/sort-classes.types'

describe('sort-classes-utils', () => {
  it('sort-classes-utils: should generate official groups', () => {
    expect(
      generateOfficialGroups(
        ['protected', 'abstract', 'override'],
        ['get-method', 'method'],
      ),
    ).toEqual([
      'protected-abstract-override-get-method',
      'protected-override-abstract-get-method',
      'abstract-protected-override-get-method',
      'abstract-override-protected-get-method',
      'override-abstract-protected-get-method',
      'override-protected-abstract-get-method',
      'protected-abstract-get-method',
      'abstract-protected-get-method',
      'protected-override-get-method',
      'override-protected-get-method',
      'abstract-override-get-method',
      'override-abstract-get-method',
      'protected-get-method',
      'abstract-get-method',
      'override-get-method',
      'get-method',
      'protected-abstract-override-method',
      'protected-override-abstract-method',
      'abstract-protected-override-method',
      'abstract-override-protected-method',
      'override-abstract-protected-method',
      'override-protected-abstract-method',
      'protected-abstract-method',
      'abstract-protected-method',
      'protected-override-method',
      'override-protected-method',
      'abstract-override-method',
      'override-abstract-method',
      'protected-method',
      'abstract-method',
      'override-method',
      'method',
    ])
  })

  describe('validateGroupsConfiguration', () => {
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
      expect(
        validateGroupsConfiguration(allPredefinedGroups, []),
      ).toBeUndefined()
    })

    it('allows custom groups', () => {
      expect(
        validateGroupsConfiguration(
          ['static-property', 'myCustomGroup'],
          [
            {
              groupName: 'myCustomGroup',
            },
          ],
        ),
      ).toBeUndefined()
    })

    it('throws an error with predefined groups with duplicate modifiers', () => {
      expect(() =>
        validateGroupsConfiguration(['static-static-property'], []),
      ).toThrow('Invalid group(s): static-static-property')
    })

    it('throws an error if a duplicate group is provided', () => {
      expect(() =>
        validateGroupsConfiguration(['static-property', 'static-property'], []),
      ).toThrow('Duplicated group(s): static-property')
    })

    it('throws an error if invalid groups are provided', () => {
      expect(() =>
        validateGroupsConfiguration(
          ['static-property', 'myCustomGroup', ''],
          [
            {
              groupName: 'myCustomGroupNotReferenced',
            },
          ],
        ),
      ).toThrow('Invalid group(s): myCustomGroup')
    })
  })
})

let getAllNonEmptyCombinations = (array: string[]): string[][] => {
  let result: string[][] = []
  for (let i = 1; i < array.length; i++) {
    result = [...result, ...getCombinations(array, i)]
  }
  return result
}
