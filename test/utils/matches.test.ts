import { describe, expect, it } from 'vitest'

import { matches } from '../../utils/matches'

describe('matches', () => {
  it('should return true if the value matches the string option', () => {
    expect(matches('foo', '^foo$')).toBe(true)
  })

  it('should return true if the value matches one of the string options', () => {
    expect(matches('foo', ['bar', '^foo$'])).toBe(true)
  })

  it('should allow passing regex flags', () => {
    expect(
      matches('FOO', {
        pattern: '^foo$',
        flags: 'i',
      }),
    ).toBe(true)
  })

  it('should allow passing regex flags in an array', () => {
    expect(
      matches('FOO', [
        'bar',
        {
          pattern: '^foo$',
          flags: 'i',
        },
      ]),
    ).toBe(true)
  })

  it('should throw an error if the regex option is not a string', () => {
    let regexOption: unknown = /foo/u

    expect(() => matches('foo', regexOption as string)).toThrow(
      'Invalid configuration: please enter your RegExp expressions as strings.\n' +
        'For example, write ".*foo" instead of /.*foo/',
    )
  })
})
