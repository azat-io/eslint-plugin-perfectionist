import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESLint } from '@typescript-eslint/utils'

import type { CommonPartitionOptions } from '../types/common-partition-options'
import type { CommonGroupsOptions } from '../types/common-groups-options'
import type { TsConfigOption } from '../types/ts-config-option'
import type { CommonOptions } from '../types/common-options'

import {
  partitionByCommentJsonSchema,
  partitionByNewlineJsonSchema,
} from './json-schemas/common-partition-json-schemas'
import { buildCommonGroupsJsonSchemas } from './json-schemas/common-groups-json-schemas'
import { buildCommonJsonSchemas } from './json-schemas/common-json-schemas'
import { tsconfigJsonSchema } from './json-schemas/tsconfig-json-schema'
import { matchesJsonSchema } from './matches-json-schema'

/**
 * Global settings for the Perfectionist plugin.
 *
 * These settings can be configured in ESLint configuration under the
 * 'perfectionist' key and apply to all Perfectionist rules unless overridden by
 * rule-specific options.
 */
export type Settings = Partial<
  Pick<
    CommonGroupsOptions<string, unknown, unknown>,
    'newlinesBetween' | 'newlinesInside'
  > & {
    tsconfig: TsConfigOption
  } & CommonPartitionOptions &
    CommonOptions
>

let defaultCommonJsonSchemas = buildCommonJsonSchemas()

let { newlinesBetween, newlinesInside } = buildCommonGroupsJsonSchemas()

/**
 * JSON schemas of the allowed settings, keyed by setting name.
 *
 * ESLint validates rule options against the same schemas, but it does not
 * validate settings.
 */
let settingsJsonSchemas: Record<string, JSONSchema4> = {
  ...defaultCommonJsonSchemas,
  partitionByComment: partitionByCommentJsonSchema,
  partitionByNewLine: partitionByNewlineJsonSchema,
  tsconfig: tsconfigJsonSchema,
  newlinesBetween,
  newlinesInside,
}

/**
 * Validates the values of the settings that a rule uses.
 *
 * A rule uses a setting when the setting is one of the rule options and the
 * rule options do not override it. The values of these settings must match the
 * JSON schemas of the rule options, which ESLint checks only for the options
 * themselves. The other settings do not affect the rule, so they are not
 * checked. As in ESLint, settings set to `undefined` are not checked either.
 * Unknown settings have no JSON schema and are rejected by `getSettings`.
 *
 * Some rules allow additional values for the common options, such as the
 * `'type-import-first'` type of `sort-imports`. These rules pass their own
 * common JSON schemas.
 *
 * @example
 *
 * ```ts
 * validateSettingsValues({
 *   settings: { type: 'Natural' },
 *   defaults: { type: 'alphabetical' },
 *   options: {},
 * })
 * // Throws: Error: Invalid value(s) for Perfectionist setting(s): type
 *
 * validateSettingsValues({
 *   settings: { type: 'Natural' },
 *   defaults: { type: 'alphabetical' },
 *   options: { type: 'natural' },
 * })
 * // Does not throw: the options override the setting.
 * ```
 *
 * @param params - Parameters object.
 * @param params.commonJsonSchemas - JSON schemas of the common options of the
 *   rule, built with `buildCommonJsonSchemas`.
 * @param params.settings - Settings returned by `getSettings`.
 * @param params.defaults - Default values of the rule options.
 * @param params.options - Rule options that override the settings.
 * @throws {Error} If a setting that the rule uses has an invalid value.
 */
export function validateSettingsValues({
  commonJsonSchemas = defaultCommonJsonSchemas,
  settings,
  defaults,
  options,
}: {
  commonJsonSchemas?: Record<string, JSONSchema4> | undefined
  settings: Record<string, unknown>
  defaults: Record<string, unknown>
  options: Record<string, unknown>
}): void {
  let settingsWithInvalidValues = Object.entries(settings)
    .filter(([key, value]) => {
      let jsonSchema = commonJsonSchemas[key] ?? settingsJsonSchemas[key]
      return (
        value !== undefined &&
        jsonSchema !== undefined &&
        Object.hasOwn(defaults, key) &&
        !Object.hasOwn(options, key) &&
        !matchesJsonSchema(value, jsonSchema)
      )
    })
    .map(([key]) => key)
  if (settingsWithInvalidValues.length > 0) {
    throw new Error(
      `Invalid value(s) for Perfectionist setting(s): ${settingsWithInvalidValues.join(', ')}`,
    )
  }
}

/**
 * Extracts and validates Perfectionist settings from ESLint configuration.
 *
 * Retrieves global Perfectionist settings that apply to all rules. Validates
 * that only allowed settings are provided and throws an error if invalid
 * options are detected. This ensures configuration errors are caught early with
 * clear error messages. The setting values are validated later by
 * `validateSettingsValues`, once it is known which settings a rule uses.
 *
 * The settings are accessed from the 'perfectionist' key in ESLint's shared
 * configuration settings.
 *
 * @example
 *
 * ```ts
 * // Valid usage:
 * const settings = getSettings(context.settings)
 * // Returns: { type: 'natural', order: 'asc', ignoreCase: true }
 * ```
 *
 * @example
 *
 * ```ts
 * // Invalid setting throws error:
 * getSettings({
 *   perfectionist: {
 *     type: 'natural',
 *     invalidOption: true, // This will throw
 *   },
 * })
 * // Throws: Error: Invalid Perfectionist setting(s): invalidOption
 * ```
 *
 * @param settings - ESLint shared configuration settings object.
 * @returns Validated Perfectionist settings or empty object if none configured.
 * @throws {Error} If invalid settings are provided.
 */
export function getSettings(
  settings: TSESLint.SharedConfigurationSettings,
): Settings {
  if (!settings['perfectionist']) {
    return {}
  }

  let perfectionistSettings = settings['perfectionist'] as Record<
    string,
    unknown
  >

  let invalidOptions = Object.keys(perfectionistSettings).filter(
    key => !Object.hasOwn(settingsJsonSchemas, key),
  )
  if (invalidOptions.length > 0) {
    throw new Error(
      `Invalid Perfectionist setting(s): ${invalidOptions.join(', ')}`,
    )
  }

  return settings['perfectionist']
}
