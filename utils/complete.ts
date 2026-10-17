import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { Settings } from './get-settings'

import { validateSettingsValues } from './get-settings'

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
 * Before merging, validates the values of the settings that end up in the
 * merged options with `validateSettingsValues`.
 *
 * @example
 *
 * ```ts
 * const finalOptions = complete({
 *   options: { type: 'natural' }, // User options (highest priority)
 *   settings: { order: 'asc' }, // Global settings
 *   defaults: { type: 'alphabetical', order: 'desc' }, // Defaults (lowest priority)
 * })
 * // Returns: { type: 'natural', order: 'asc' }
 * ```
 *
 * @template T - Type of the configuration object.
 * @param params - Parameters object.
 * @param params.options - Rule-specific options provided by the user (highest
 *   priority).
 * @param params.settings - Global settings from ESLint configuration.
 * @param params.defaults - Default values for the configuration (lowest
 *   priority).
 * @param params.commonJsonSchemas - JSON schemas of the common options of the
 *   rule, passed by rules that allow additional values for these options.
 * @returns Merged configuration object with all three levels combined.
 * @throws {Error} If a setting in the merged options has an invalid value.
 */
export function complete<T extends Record<string, unknown>>({
  commonJsonSchemas,
  options = {},
  settings,
  defaults,
}: {
  commonJsonSchemas?: Record<string, JSONSchema4>
  options?: Partial<T> | undefined
  settings: Settings
  defaults: T
}): T {
  validateSettingsValues({ commonJsonSchemas, settings, defaults, options })
  return { ...defaults, ...settings, ...options }
}
