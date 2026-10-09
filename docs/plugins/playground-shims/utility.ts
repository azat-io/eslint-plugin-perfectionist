/**
 * Serializes a value for debug output.
 *
 * @param value - Any value.
 * @returns JSON text, or the string form when JSON fails.
 */
export function inspect(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Joins arguments with spaces.
 *
 * @param values - Values to print.
 * @returns Space-separated text.
 */
export function format(...values: unknown[]): string {
  return values.map(String).join(' ')
}

/**
 * Keeps a deprecated function as is, without the warning.
 *
 * @param callback - Deprecated function.
 * @returns The same function.
 */
export function deprecate<T>(callback: T): T {
  return callback
}

/**
 * Returns a logger that prints nothing.
 *
 * @returns No-op logger.
 */
export function debuglog(): () => void {
  return () => {}
}

export let types = {}

export default { deprecate, debuglog, inspect, format, types }
