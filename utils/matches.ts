import type { RegexOption } from '../types/common-options'

/**
 * Tests if a string matches a regular expression pattern.
 *
 * Supports multiple formats for regex options:
 *
 * - String: Treated as a regex pattern (e.g., "^foo$")
 * - Array: Matches if any pattern in the array matches (OR logic)
 * - Object: Pattern with optional flags (e.g., { pattern: "^foo$", flags: "i" }).
 *
 * The function recursively processes arrays of patterns and includes error
 * handling for invalid regex configurations (e.g., passing RegExp objects
 * instead of strings).
 *
 * @example
 *   // String pattern
 *   matches('foo', '^foo$') // Returns: true
 *   matches('foobar', '^foo$') // Returns: false
 *
 * @example
 *   // Array of patterns (OR logic)
 *   matches('foo', ['bar', '^foo$']) // Returns: true (matches second pattern)
 *   matches('baz', ['bar', '^foo$']) // Returns: false (matches neither)
 *
 * @example
 *   // Pattern with flags
 *   matches('FOO', {
 *     pattern: '^foo$',
 *     flags: 'i',
 *   }) // Returns: true (case-insensitive)
 *   matches('FOO', '^foo$') // Returns: false (case-sensitive)
 *
 * @param value - The string to test against the pattern(s).
 * @param regexOption - The regex pattern(s) to match against.
 * @returns True if the value matches the pattern(s), false otherwise.
 * @throws {Error} If a RegExp object is passed instead of a string pattern.
 */
export function matches(value: string, regexOption: RegexOption): boolean {
  if (Array.isArray(regexOption)) {
    return regexOption.some(opt => matches(value, opt))
  }

  if (typeof regexOption === 'string') {
    return new RegExp(regexOption).test(value)
  }

  /*
   * Handler for non-string regexes until an error is thrown on the JSON schema
   * Level.
   */
  if ('source' in regexOption) {
    throw new Error(
      'Invalid configuration: please enter your RegExp expressions as strings.\n' +
        'For example, write ".*foo" instead of /.*foo/',
    )
  }

  return new RegExp(regexOption.pattern, regexOption.flags).test(value)
}
