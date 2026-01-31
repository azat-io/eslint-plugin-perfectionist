/**
 * Converts a boolean value to a sort direction multiplier.
 *
 * Used in sorting functions to convert boolean comparisons into numeric values
 * suitable for array sort callbacks. This allows for concise expression of sort
 * direction logic.
 *
 * @example
 *
 * ```ts
 * // In ascending sort
 * convertBooleanToSign(true) // Returns: 1
 * convertBooleanToSign(false) // Returns: -1
 * ```
 *
 * @example
 *
 * ```ts
 * // Usage in sorting
 * const sortMultiplier = convertBooleanToSign(order === 'asc')
 * return sortMultiplier * (a - b)
 * ```
 *
 * @param value - Boolean value to convert to a sign.
 * @returns 1 if value is true, -1 if value is false.
 */
export function convertBooleanToSign(value: boolean): -1 | 1 {
  return value ? 1 : -1
}
