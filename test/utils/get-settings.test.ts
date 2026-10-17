import { describe, expect, it } from 'vitest'

import type { Settings } from '../../utils/get-settings'

import { buildCommonJsonSchemas } from '../../utils/json-schemas/common-json-schemas'
import { validateSettingsValues, getSettings } from '../../utils/get-settings'

let validSettings: { [key in keyof Required<Settings>]: Settings[key] } = {
  tsconfig: {
    filename: 'tsconfig.json',
    rootDir: '.',
  },
  fallbackSort: { type: 'alphabetical' },
  partitionByComment: 'value',
  specialCharacters: 'keep',
  partitionByNewLine: true,
  type: 'alphabetical',
  newlinesBetween: 1,
  newlinesInside: 1,
  ignoreCase: true,
  locales: 'en-US',
  alphabet: '',
  order: 'asc',
}

describe('get-settings', () => {
  it('throws an error when an invalid setting is provided', () => {
    expect(() => {
      getSettings({
        perfectionist: {
          invalidOption1: 'value',
          invalidOption2: 'value',
        },
      })
    }).toThrow(
      'Invalid Perfectionist setting(s): invalidOption1, invalidOption2',
    )
  })

  it('accepts official settings provided', () => {
    expect(() => {
      getSettings({
        perfectionist: validSettings,
      })
    }).not.toThrow()
  })

  describe('validateSettingsValues', () => {
    it('accepts valid values', () => {
      expect(() => {
        validateSettingsValues({
          settings: validSettings,
          defaults: validSettings,
          options: {},
        })
      }).not.toThrow()
    })

    it.each([
      ['type', 'Natural'],
      ['order', 'ascending'],
      ['fallbackSort', 'alphabetical'],
      ['alphabet', 0],
      ['ignoreCase', 'false'],
      ['specialCharacters', 'bogus'],
      ['locales', ['en-US', 0]],
      ['partitionByComment', 0],
      ['partitionByNewLine', 'true'],
      ['newlinesBetween', 'always'],
      ['newlinesInside', -1],
      ['tsconfig', { filename: 'tsconfig.json' }],
    ])('throws an error when %s has an invalid value', (setting, value) => {
      expect(() => {
        validateSettingsValues({
          settings: { [setting]: value },
          defaults: validSettings,
          options: {},
        })
      }).toThrow(`Invalid value(s) for Perfectionist setting(s): ${setting}`)
    })

    it('lists every setting with an invalid value', () => {
      expect(() => {
        validateSettingsValues({
          settings: { order: 'ascending', type: 'Natural' },
          defaults: validSettings,
          options: {},
        })
      }).toThrow('Invalid value(s) for Perfectionist setting(s): order, type')
    })

    it('ignores settings overridden by options', () => {
      expect(() => {
        validateSettingsValues({
          options: { type: 'alphabetical' },
          settings: { type: 'usage' },
          defaults: validSettings,
        })
      }).not.toThrow()
    })

    it('ignores settings overridden by options set to undefined', () => {
      expect(() => {
        validateSettingsValues({
          options: { type: undefined },
          settings: { type: 'usage' },
          defaults: validSettings,
        })
      }).not.toThrow()
    })

    it('ignores settings that are not options of the rule', () => {
      expect(() => {
        validateSettingsValues({
          settings: { tsconfig: { filename: 'tsconfig.json' } },
          defaults: { type: 'alphabetical' },
          options: {},
        })
      }).not.toThrow()
    })

    it('ignores settings set to undefined', () => {
      expect(() => {
        validateSettingsValues({
          settings: { partitionByNewLine: undefined },
          defaults: validSettings,
          options: {},
        })
      }).not.toThrow()
    })

    it('accepts values allowed by the common JSON schemas of the rule', () => {
      expect(() => {
        validateSettingsValues({
          commonJsonSchemas: buildCommonJsonSchemas({
            allowedAdditionalTypeValues: ['type-import-first'],
          }),
          settings: {
            fallbackSort: { type: 'type-import-first' },
            type: 'type-import-first',
          },
          defaults: validSettings,
          options: {},
        })
      }).not.toThrow()
    })

    it('rejects values allowed only by the common JSON schemas of other rules', () => {
      expect(() => {
        validateSettingsValues({
          settings: { type: 'type-import-first' },
          defaults: validSettings,
          options: {},
        })
      }).toThrow('Invalid value(s) for Perfectionist setting(s): type')
    })
  })
})
