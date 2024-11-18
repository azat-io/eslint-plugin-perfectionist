import { describe, expect, it } from 'vitest'

import type { Settings } from '../utils/get-settings'

import { getSettings } from '../utils/get-settings'

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
    let allowedOptions: { [key in keyof Required<Settings>]: Settings[key] } = {
      partitionByComment: 'value',
      specialCharacters: 'keep',
      partitionByNewLine: true,
      type: 'alphabetical',
      ignorePattern: [],
      ignoreCase: true,
      locales: 'en-US',
      order: 'asc',
    }
    expect(() => {
      getSettings({
        perfectionist: allowedOptions,
      })
    }).not.toThrow()
  })
})
