import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-exports rule.
 *
 * This rule enforces consistent ordering of re-export statements (`export ...
 * From '...'`) to improve code organization and maintainability.
 */
export type Options = Partial<
  CommonGroupsOptions<CustomGroupMatchOptions, object, TypeOption> &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/**
 * Union type of available export modifiers. Distinguishes between value exports
 * and type-only exports.
 */
export type Modifier = (typeof allModifiers)[number]

/**
 * Type of selector for export statements. Currently represents re-export
 * statements.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Additional configuration for a single custom group.
 *
 * Custom groups allow fine-grained control over how export statements are
 * grouped and sorted based on their module names, selectors, and modifiers.
 *
 * @example
 *   {
 *     "modifiers": ["type"],
 *     "selector": "export"
 *   }
 */
interface CustomGroupMatchOptions {
  /**
   * List of modifiers that exports must have to be included in this group. Can
   * include 'value' for value exports or 'type' for type exports.
   */
  modifiers?: Modifier[]

  /**
   * The selector type for this group. Currently only 'export' is supported for
   * re-export statements.
   */
  selector?: Selector
}

/**
 * Complete list of available export selectors. Used for validation and JSON
 * schema generation.
 */
export let allSelectors = ['export'] as const

/**
 * Complete list of available export modifiers. Used for validation and JSON
 * schema generation.
 */
export let allModifiers = [
  'value',
  'type',
  'named',
  'wildcard',
  'multiline',
  'singleline',
] as const

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 */
export let customGroupMatchOptionsJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
