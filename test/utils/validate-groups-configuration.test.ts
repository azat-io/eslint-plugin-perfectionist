import { describe, expect, it } from 'vitest'

import { validateGroupsConfiguration } from '../../utils/validate-groups-configuration'

/**
 * It is currently not possible to test rules that throw errors
 * (https://github.com/eslint/eslint/issues/13434), so getting 100% code
 * coverage is not possible only through ESLint's  RuleTester as there is no way
 * to catch the error thrown from `validateGroupsConfiguration`. We can get 100%
 * coverage temporarily with this unit test until that feature is implemented in
 * ESLint.
 *
 */
describe('validate-groups-configuration', () => {
  it('throws an error when an invalid group is provided', () => {
    expect(() => {
      validateGroupsConfiguration(
        ['predefinedGroup', ['customGroup', 'invalidGroup1'], 'invalidGroup2'],
        ['predefinedGroup'],
        ['customGroup'],
      )
    }).toThrow('Invalid group(s): invalidGroup1, invalidGroup2')
  })

  it('throws an error when a duplicate group is provided', () => {
    expect(() => {
      validateGroupsConfiguration(
        ['predefinedGroup', 'predefinedGroup'],
        ['predefinedGroup'],
        [],
      )
    }).toThrow('Duplicated group(s): predefinedGroup')
  })
})
