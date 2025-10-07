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

  it.each(['modifier1-modifier1', 'double-modifier-modifier1-double-modifier'])(
    "throws an error with duplicate modifiers '(%s)'",
    groupModifiers => {
      expect(() =>
        validateGeneratedGroupsConfiguration({
          options: {
            groups: [`${groupModifiers}-selector1`],
            customGroups: [],
          },
          selectors,
          modifiers,
        }),
      ).toThrow(`Invalid group(s): ${groupModifiers}-selector1`)
    },
  )

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
        selectors,
        modifiers,
      }),
    ).toThrow('Invalid group(s): nonAllowedModifier-selector1, myCustomGroup')
  })

  it.each([
    { groups: [{ newlinesBetween: 1 }, { newlinesBetween: 1 }] },
    { groups: [{ newlinesBetween: 1 }, { commentAbove: 'foo' }] },
    { groups: [{ commentAbove: 'foo' }, { commentAbove: 'bar' }] },
  ] as const)(
    'throws an error with consecutive newlines/commentAbove objects (%s)',
    ({ groups }) => {
      expect(() => {
        validateGeneratedGroupsConfiguration({
          options: {
            groups: [...groups],
            customGroups: [],
          },
          selectors: [],
          modifiers: [],
        })
      }).toThrow(
        'Consecutive objects (`newlinesBetween` or `commentAbove` are not allowed: merge them into a single object',
      )
    },
  )
})

function getAllNonEmptyCombinations(array: string[]): string[][] {
  let result: string[][] = []
  for (let i = 1; i < array.length; i++) {
    result = [...result, ...getArrayCombinations(array, i)]
  }
  return result
}
