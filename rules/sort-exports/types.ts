import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { JoinWithDash } from '../../types/join-with-dash'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Defines a custom group for export statement categorization.
 *
 * Custom groups allow fine-grained control over how export statements are
 * grouped and sorted based on their module names, selectors, and modifiers.
 *
 * @example
 *   {
 *     "modifiers": ["type"],
 *     "selector": "export",
 *     "elementNamePattern": "^@company/"
 *   }
 */
export type SingleCustomGroup = {
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
} & {
  /**
   * Regular expression pattern to match module names in export statements.
   * Exports from modules matching this pattern will be included in this custom
   * group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Configuration options for the sort-exports rule.
 *
 * This rule enforces consistent ordering of re-export statements (`export ...
 * From '...'`) to improve code organization and maintainability.
 */
export type Options = Partial<
  CommonGroupsOptions<Group, SingleCustomGroup> &
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
 * Represents all possible predefined export group combinations. Combines
 * modifiers with the export selector using dash notation.
 */
type ExportGroup = JoinWithDash<[ValueModifier, TypeModifier, ExportSelector]>

/**
 * Represents a group identifier for export categorization. Can be a predefined
 * export group, 'unknown' for uncategorized exports, or a custom group name.
 */
type Group = ExportGroup | 'unknown' | string

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
  elementNamePattern: regexJsonSchema,
}
