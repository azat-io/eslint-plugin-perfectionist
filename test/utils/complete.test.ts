import { describe, expect, it } from 'vitest'

import type { Settings } from '../../utils/get-settings'

import { buildCommonJsonSchemas } from '../../utils/json-schemas/common-json-schemas'
import { complete } from '../../utils/complete'

describe('complete', () => {
  it('should merge options, settings, and defaults with correct priority', () => {
    let options = { optionsField: 'foo', a: 'options_a' }
    let settings = {
      settingsField: 'foo',
      a: 'settings_a',
      b: 'settings_b',
    } as Settings
    let defaults = {
      defaultsField: 'foo',
      a: 'defaults_a',
      b: 'defaults_b',
      c: 'defaults_c',
    }

    let result = complete({ settings, defaults, options })

    expect(result).toEqual({
      defaultsField: 'foo',
      settingsField: 'foo',
      optionsField: 'foo',
      b: 'settings_b',
      c: 'defaults_c',
      a: 'options_a',
    })
  })

  it.each([
    { settingsValue: false, defaultsValue: false },
    { settingsValue: false, defaultsValue: true },
    { defaultsValue: false, settingsValue: true },
    { settingsValue: true, defaultsValue: true },
  ])(
    'should always prioritize option values when defined',
    ({ defaultsValue, settingsValue }) => {
      let options = { field: false }
      let settings = { field: settingsValue } as Settings
      let defaults = { field: defaultsValue }

      let result = complete({ settings, defaults, options })

      expect(result).toEqual({ field: false })
    },
  )

  it.each([false, true])(
    'should always prioritize settings values when defined and options are undefined',
    defaultsValue => {
      let options = {}
      let settings = { field: false } as Settings
      let defaults = { field: defaultsValue }

      let result = complete({ settings, defaults, options })

      expect(result).toEqual({ field: false })
    },
  )

  it('validates the settings values used by the merged options', () => {
    expect(() => {
      complete({
        defaults: { type: 'alphabetical' },
        settings: { type: 'Natural' },
      })
    }).toThrow('Invalid value(s) for Perfectionist setting(s): type')
  })

  it('does not validate settings overridden by options', () => {
    let result = complete({
      defaults: { type: 'alphabetical' },
      settings: { type: 'Natural' },
      options: { type: 'natural' },
    })

    expect(result).toEqual({ type: 'natural' })
  })

  it('validates the settings against the given common JSON schemas', () => {
    let result = complete({
      commonJsonSchemas: buildCommonJsonSchemas({
        allowedAdditionalTypeValues: ['type-import-first'],
      }),
      settings: { type: 'type-import-first' },
      defaults: { type: 'alphabetical' },
    })

    expect(result).toEqual({ type: 'type-import-first' })
  })
})
