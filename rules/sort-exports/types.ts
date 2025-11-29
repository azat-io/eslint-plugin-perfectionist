import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-json-schemas'

/**
 * Configuration options for the sort-exports rule.
 *
 * This rule enforces consistent ordering of re-export statements (`export ...
 * From '...'`) to improve code organization and maintainability.
 */
export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Union type of available export modifiers. Distinguishes between value exports
 * and type-only exports.
 */
export type Modifier = ValueModifier | TypeModifier

/**
 * Type of selector for export statements. Currently represents re-export
 * statements.
 */
export type Selector = ExportSelector

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
interface SingleCustomGroup {
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
 * Selector for export statements. Identifies re-export statements (`export ...
 * From '...'`).
 */
type ExportSelector = 'export'

/**
 * Modifier for value exports. Identifies regular export statements that export
 * runtime values.
 */
type ValueModifier = 'value'

/**
 * Modifier for type-only exports. Identifies export statements with the `type`
 * keyword (`export type ... From '...'`).
 */
type TypeModifier = 'type'

/**
 * Complete list of available export selectors. Used for validation and JSON
 * schema generation.
 */
export let allSelectors: Selector[] = ['export']
/**
 * Complete list of available export modifiers. Used for validation and JSON
 * schema generation.
 */
export let allModifiers: Modifier[] = ['value', 'type']

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
