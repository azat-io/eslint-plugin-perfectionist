import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-named-exports rule.
 *
 * Controls how named exports are sorted within export statements.
 */
export type Options = Partial<
  {
    /**
     * Whether to ignore export aliases when sorting. When true, sorts by the
     * original name rather than the alias.
     *
     * @default false
     */
    ignoreAlias: boolean
  } & CommonGroupsOptions<
    SingleCustomGroup,
    Record<string, never>,
    TypeOption
  > &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/** Extended sorting node for named export specifiers. */
export type SortNamedExportsSortingNode = SortingNode<TSESTree.ExportSpecifier>

/**
 * Union type of all available modifiers for named exports.
 *
 * Modifiers distinguish between type exports and value exports.
 */
export type Modifier = ValueModifier | TypeModifier

/**
 * Union type of all available selectors for named exports.
 *
 * Currently only includes the 'export' selector.
 */
export type Selector = ExportSelector

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * Array of modifiers that exports must have to match this group. Can include
   * 'type' for type exports or 'value' for value exports.
   */
  modifiers?: Modifier[]

  /**
   * The selector type this group matches. Currently only 'export' is available
   * for named exports.
   */
  selector?: Selector
}

/**
 * Selector for export specifiers.
 *
 * Matches named export declarations like `export { name }`.
 */
type ExportSelector = 'export'

/**
 * Modifier indicating a value export.
 *
 * Applied to regular JavaScript/TypeScript value exports (not type-only).
 */
type ValueModifier = 'value'

/**
 * Modifier indicating a type export.
 *
 * Applied to TypeScript type-only exports like `export type { MyType }`.
 */
type TypeModifier = 'type'

/**
 * Array of all available selectors for named exports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = ['export']
/**
 * Array of all available modifiers for named exports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers: Modifier[] = ['value', 'type']

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-named-exports.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
