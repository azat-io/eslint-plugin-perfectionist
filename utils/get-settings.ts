import type { TSESLint } from '@typescript-eslint/utils'

import type {
  PartitionByCommentOption,
  CommonOptions,
  RegexOption,
} from '../types/common-options'

/**
 * Global settings for the Perfectionist plugin.
 *
 * These settings can be configured in ESLint configuration under the
 * 'perfectionist' key and apply to all Perfectionist rules unless overridden by
 * rule-specific options.
 */
export type Settings = Partial<{
  /**
   * Configuration for partition comments that separate code sections. Can be
   * boolean, string, array of strings, or object with block/line specific
   * settings.
   */
  partitionByComment: PartitionByCommentOption

  /** Whether to create partitions at newlines. */
  partitionByNewLine: boolean

  /** Pattern to match elements that should be ignored during sorting. */
  ignorePattern: RegexOption
}> &
  Partial<CommonOptions>

/**
 * Extracts and validates Perfectionist settings from ESLint configuration.
 *
 * Retrieves global Perfectionist settings that apply to all rules. Validates
 * that only allowed settings are provided and throws an error if invalid
 * options are detected. This ensures configuration errors are caught early with
 * clear error messages.
 *
 * The settings are accessed from the 'perfectionist' key in ESLint's shared
 * configuration settings.
 *
 * @example
 *   // Valid usage:
 *   const settings = getSettings(context.settings)
 *   // Returns: { type: 'natural', order: 'asc', ignoreCase: true }
 *
 * @example
 *   // Invalid setting throws error:
 *   getSettings({
 *     perfectionist: {
 *       type: 'natural',
 *       invalidOption: true, // This will throw
 *     },
 *   })
 *   // Throws: Error: Invalid Perfectionist setting(s): invalidOption
 *
 * @param settings - ESLint shared configuration settings object.
 * @returns Validated Perfectionist settings or empty object if none configured.
 * @throws {Error} If invalid settings are provided.
 */
export function getSettings(
  settings: TSESLint.SharedConfigurationSettings = {},
): Settings {
  if (!settings['perfectionist']) {
    return {}
  }

  /**
   * Identifies settings keys that are not in the allowed list.
   *
   * @param object - Settings object to validate.
   * @returns Array of invalid setting names.
   */
  function getInvalidOptions(object: Record<string, unknown>): string[] {
    let allowedOptions = new Set<keyof Settings>([
      'partitionByComment',
      'partitionByNewLine',
      'specialCharacters',
      'ignorePattern',
      'fallbackSort',
      'ignoreCase',
      'alphabet',
      'locales',
      'order',
      'type',
    ])

    return Object.keys(object).filter(
      key => !allowedOptions.has(key as keyof Settings),
    )
  }

  let perfectionistSettings = settings['perfectionist'] as Record<
    string,
    unknown
  >

  let invalidOptions = getInvalidOptions(perfectionistSettings)
  if (invalidOptions.length > 0) {
    throw new Error(
      `Invalid Perfectionist setting(s): ${invalidOptions.join(', ')}`,
    )
  }

  return settings['perfectionist'] as Settings
}
