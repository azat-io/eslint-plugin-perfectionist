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
  } & CommonGroupsOptions<CustomGroupMatchOptions, object, TypeOption> &
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
export type Modifier = (typeof allModifiers)[number]

/**
 * Union type of all available selectors for named exports.
 *
 * Currently only includes the 'export' selector.
 */
export type Selector = (typeof allSelectors)[number]

/** Match options for a custom group. */
interface CustomGroupMatchOptions {
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
 * Array of all available selectors for named exports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = ['export'] as const

/**
 * Array of all available modifiers for named exports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers = ['value', 'type'] as const

/**
 * Additional custom group match options JSON schema. Used by ESLint to validate
 * rule options at configuration time.
 */
export let customGroupMatchOptionsJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
