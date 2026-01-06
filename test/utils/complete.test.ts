import { describe, expect, it } from 'vitest'

import type { Settings } from '../../utils/get-settings'

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

    let result = complete(options, settings, defaults)

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
    { defaultsValue: false, settingsValue: false },
    { settingsValue: false, defaultsValue: true },
    { defaultsValue: false, settingsValue: true },
    { defaultsValue: true, settingsValue: true },
  ])(
    'should always prioritize option values when defined',
    ({ defaultsValue, settingsValue }) => {
      let options = { field: false }
      let settings = { field: settingsValue } as Settings
      let defaults = { field: defaultsValue }

      let result = complete(options, settings, defaults)

      expect(result).toEqual({ field: false })
    },
  )

  it.each([false, true])(
    'should always prioritize settings values when defined and options are undefined',
    defaultsValue => {
      let options = {}
      let settings = { field: false } as Settings
      let defaults = { field: defaultsValue }

      let result = complete(options, settings, defaults)

      expect(result).toEqual({ field: false })
    },
  )
})
