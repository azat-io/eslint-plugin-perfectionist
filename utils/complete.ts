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
  return { ...defaults, ...settings, ...options }
}
