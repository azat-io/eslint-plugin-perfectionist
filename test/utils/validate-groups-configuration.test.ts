import { describe, expect, it } from 'vitest'

import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'
import { getArrayCombinations } from '../../utils/get-array-combinations'

describe('validate-groups-configuration', () => {
  let selectors = [
    'selector1',
    'selector2',
    'selector3',
    'double-selector',
    'three-word-selector',
  ]
  let modifiers = ['modifier1', 'modifier2', 'modifier3', 'double-modifier']

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
      validateGroupsConfiguration({
        options: {
          groups: allPredefinedGroups,
          customGroups: [],
        },
        modifiers,
        selectors,
      }),
    ).not.toThrowError()
  })

  it('allows custom groups', () => {
    expect(() =>
      validateGroupsConfiguration({
        options: {
          customGroups: [
            {
              groupName: 'myCustomGroup',
            },
          ],
          groups: ['modifier1-selector1', 'myCustomGroup'],
        },
        modifiers,
        selectors,
      }),
    ).not.toThrowError()
  })

  it.each(['modifier1-modifier1', 'double-modifier-modifier1-double-modifier'])(
    "throws an error with duplicate modifiers '(%s)'",
    groupModifiers => {
      expect(() =>
        validateGroupsConfiguration({
          options: {
            groups: [`${groupModifiers}-selector1`],
            customGroups: [],
          },
          modifiers,
          selectors,
        }),
      ).toThrowError(`Invalid group(s): ${groupModifiers}-selector1`)
    },
  )

  it('throws an error if a duplicate group is provided', () => {
    expect(() =>
      validateGroupsConfiguration({
        options: {
          groups: ['modifier1-selector1', 'modifier1-selector1'],
          customGroups: [],
        },
        modifiers,
        selectors,
      }),
    ).toThrowError('Duplicated group(s): modifier1-selector1')
  })

  it('throws an error if invalid groups are provided', () => {
    expect(() =>
      validateGroupsConfiguration({
        options: {
          groups: [
            'modifier1-selector1',
            'nonAllowedModifier-selector1',
            'myCustomGroup',
            '',
          ],
          customGroups: [
            {
              groupName: 'myCustomGroupNotReferenced',
            },
          ],
        },
        modifiers,
        selectors,
      }),
    ).toThrowError(
      'Invalid group(s): nonAllowedModifier-selector1, myCustomGroup',
    )
  })

  it('throws an error with consecutive newlinesBetween objects', () => {
    expect(() => {
      validateGroupsConfiguration({
        options: {
          groups: ['unknown', { newlinesBetween: 1 }, { newlinesBetween: 1 }],
          customGroups: [],
        },
        modifiers: [],
        selectors: [],
      })
    }).toThrowError('Consecutive `newlinesBetween` objects are not allowed')
  })
})

function getAllNonEmptyCombinations(array: string[]): string[][] {
  let result: string[][] = []
  for (let i = 1; i < array.length; i++) {
    result = [...result, ...getArrayCombinations(array, i)]
  }
  return result
}
