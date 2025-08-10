import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-named-exports rule.
 *
 * Controls how named exports are sorted within export statements.
 */
export type Options = Partial<
  {
    /**
     * @deprecated Since v4.12.0. Will be removed in v5.0.0. Use {@link groups}
     *   instead. Controls whether type exports or value exports should be
     *   grouped first.
     */
    groupKind: 'values-first' | 'types-first' | 'mixed'

    /**
     * Custom groups for organizing named exports. Allows defining groups based
     * on export names and types.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Partition named exports by comment delimiters. Exports separated by
     * specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of named
     * exports.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of named exports. Exports are sorted
     * within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition named exports by newlines. When true, exports
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean

    /**
     * Whether to ignore export aliases when sorting. When true, sorts by the
     * original name rather than the alias.
     *
     * @default false
     */
    ignoreAlias: boolean
  } & CommonOptions
>[]

/**
 * Configuration for a single custom group in named exports sorting.
 *
 * Allows defining custom groups based on export characteristics and name
 * patterns.
 */
export type SingleCustomGroup = {
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
} & {
  /**
   * Regular expression pattern to match against export names. Only exports with
   * names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Extended sorting node for named export specifiers.
 *
 * Represents a named export with additional metadata needed for sorting,
 * including whether it's a type or value export.
 */
export interface SortNamedExportsSortingNode
  extends SortingNode<TSESTree.ExportSpecifier> {
  /**
   * Indicates whether the export is a type or value export. Used for grouping
   * exports by their kind.
   */
  groupKind: 'value' | 'type'
}

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

/**
 * Group type for export specifiers.
 *
 * Represents all possible combinations of modifiers with the export selector,
 * joined with dashes to form group identifiers like 'export', 'type-export', or
 * 'value-export'.
 */
type ExportGroup = JoinWithDash<[ValueModifier, TypeModifier, ExportSelector]>

/**
 * Union type of all possible group identifiers for named exports.
 *
 * Groups are used to organize and sort related exports together. Can be
 * predefined export groups, 'unknown' for unmatched exports, or custom string
 * identifiers.
 */
type Group = ExportGroup | 'unknown' | string

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
 * Provides additional schema properties specific to the sort-named-exports
 * rule, extending the base custom group schema with element name patterns.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
