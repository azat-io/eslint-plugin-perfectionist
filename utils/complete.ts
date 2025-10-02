import type { Settings } from './get-settings'

/**
 * Merges configuration options with settings and defaults in priority order.
 *
 * Combines three levels of configuration with increasing priority:
 *
 * 1. Default values (lowest priority)
 * 2. Global settings from ESLint configuration.
 * 3. Rule-specific options (highest priority).
 *
 * This ensures that user-provided options always override settings, and
 * settings always override defaults.
 *
 * @example
 *   const finalOptions = complete(
 *     { type: 'natural' }, // User options (highest priority)
 *     { order: 'asc' }, // Global settings
 *     { type: 'alphabetical', order: 'desc' }, // Defaults (lowest priority)
 *   )
 *   // Returns: { type: 'natural', order: 'asc' }
 *
 * @template T - Type of the configuration object.
 * @param options - Rule-specific options provided by the user (highest
 *   priority).
 * @param settings - Global settings from ESLint configuration.
 * @param defaults - Default values for the configuration (lowest priority).
 * @returns Merged configuration object with all three levels combined.
 */
export function complete<T extends Record<string, unknown>>(
  options: Partial<T> = {},
  settings: Settings = {},
  defaults: T = {} as T,
): T {
  let strippedOptions = stripDefaultValues(
    options as Record<string, unknown>,
    defaults as Record<string, unknown>,
  )

  return {
    ...defaults,
    ...settings,
    ...(strippedOptions as Record<string, unknown> & Partial<T>),
  }
}

/**
 * Recursively removes properties from `options` that are identical to those in
 * `defaults`, returning a new object with only the differing properties.
 *
 * This is useful for minimizing configuration objects by stripping out default
 * values, allowing for cleaner overrides.
 *
 * @param options - The configuration object to strip defaults from.
 * @param defaults - The default configuration object to compare against.
 * @returns A new object containing only the properties from `options` that
 *   differ from `defaults`.
 */
function stripDefaultValues(
  options: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  let result: Record<string, unknown> = {}

  for (let key of Object.keys(options)) {
    let optionValue = options[key]

    if (!(key in defaults)) {
      result[key] = optionValue
      continue
    }

    let defaultValue = defaults[key]

    if (isPlainObject(optionValue) && isPlainObject(defaultValue)) {
      let nestedDiff = stripDefaultValues(optionValue, defaultValue)

      if (Object.keys(nestedDiff).length > 0) {
        result[key] = nestedDiff
      }

      continue
    }

    if (!isDeepEqual(optionValue, defaultValue)) {
      result[key] = optionValue
    }
  }

  return result
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false
    }

    for (let [index, element] of a.entries()) {
      if (!isDeepEqual(element, b[index])) {
        return false
      }
    }

    return true
  }

  return false
}

/**
 * Checks if a value is a plain object (i.e., an object created by the Object
 * constructor or with a null prototype).
 *
 * @param value - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.constructor === Object || Object.getPrototypeOf(value) === null)
  )
}
