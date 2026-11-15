import { describe, expect, it } from 'vitest'

import { parsePredefinedGroup } from '../../utils/parse-predefined-group'

let allSelectors = ['get-method', 'method', 'side-effect-style'] as const
let allModifiers = ['static', 'side-effect', 'async'] as const

describe('parse-predefined-group', () => {
  it('parses a selector without modifiers', () => {
    expect(parse('method')).toStrictEqual({
      selector: 'method',
      modifiers: [],
    })
  })

  it('parses modifiers in `allModifiers` order', () => {
    expect(parse('async-static-method')).toStrictEqual({
      modifiers: ['static', 'async'],
      selector: 'method',
    })
  })

  it('parses selectors and modifiers containing dashes', () => {
    expect(parse('async-side-effect-side-effect-style')).toStrictEqual({
      modifiers: ['side-effect', 'async'],
      selector: 'side-effect-style',
    })
  })

  it('prefers the longest selector regardless of `allSelectors` order', () => {
    expect(
      parsePredefinedGroup({
        allSelectors: ['method', 'get-method'],
        name: 'static-get-method',
        allModifiers,
      }),
    ).toStrictEqual({
      selector: 'get-method',
      modifiers: ['static'],
    })
  })

  it('returns null for names without a known selector', () => {
    expect(parse('static')).toBeNull()
  })

  it('returns null for names with unknown words', () => {
    expect(parse('lifecycle-method')).toBeNull()
  })

  it('returns null for repeated modifiers', () => {
    expect(parse('static-static-method')).toBeNull()
  })
})

function parse(name: string): ReturnType<typeof parsePredefinedGroup> {
  return parsePredefinedGroup({
    allSelectors,
    allModifiers,
    name,
  })
}
