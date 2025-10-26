/**
 * Converts the provided code point into its string representation.
 *
 * @param value - Code point to convert.
 * @returns String representation of the code point.
 */
export function codePointToString(value: number): string {
  return String.fromCodePoint(value)
}
