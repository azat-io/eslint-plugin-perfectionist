import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration for a single custom group in named imports sorting.
 *
 * Allows defining custom groups based on import characteristics and name
 * patterns.
 */
export type SingleCustomGroup = {
  /**
   * Array of modifiers that imports must have to match this group. Can include
   * 'type' for type imports or 'value' for value imports.
   */
  modifiers?: Modifier[]

  /**
   * The selector type this group matches. Currently only 'import' is available
   * for named imports.
   */
  selector?: Selector
} & {
  /**
   * Regular expression pattern to match against import names. Only imports with
   * names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Configuration options for the sort-named-imports rule.
 *
 * Controls how named imports are sorted within import statements.
 */
export type Options = Partial<
  {
    /**
     * Whether to ignore import aliases when sorting. When true, sorts by the
     * original name rather than the alias.
     *
     * @default false
     */
    ignoreAlias: boolean
  } & CommonGroupsOptions<Group, SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/** Extended sorting node for named import specifiers. */
export type SortNamedImportsSortingNode = SortingNode<TSESTree.ImportClause>

/**
 * Union type of all available modifiers for named imports.
 *
 * Modifiers distinguish between type imports and value imports.
 */
export type Modifier = ValueModifier | TypeModifier

/**
 * Union type of all available selectors for named imports.
 *
 * Currently only includes the 'import' selector.
 */
export type Selector = ImportSelector

/**
 * Group type for import specifiers.
 *
 * Represents all possible combinations of modifiers with the import selector,
 * joined with dashes to form group identifiers like 'import', 'type-import', or
 * 'value-import'.
 */
type ImportGroup = JoinWithDash<[ValueModifier, TypeModifier, ImportSelector]>

/**
 * Union type of all possible group identifiers for named imports.
 *
 * Groups are used to organize and sort related imports together. Can be
 * predefined import groups, 'unknown' for unmatched imports, or custom string
 * identifiers.
 */
type Group = ImportGroup | 'unknown' | string

/**
 * Selector for import specifiers.
 *
 * Matches named import declarations like `import { name } from 'module'`.
 */
type ImportSelector = 'import'

/**
 * Modifier indicating a value import.
 *
 * Applied to regular JavaScript/TypeScript value imports (not type-only).
 */
type ValueModifier = 'value'

/**
 * Modifier indicating a type import.
 *
 * Applied to TypeScript type-only imports like `import type { MyType } from
 * 'module'`.
 */
type TypeModifier = 'type'

/**
 * Array of all available selectors for named imports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = ['import']

/**
 * Array of all available modifiers for named imports.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allModifiers: Modifier[] = ['value', 'type']

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-named-imports
 * rule, extending the base custom group schema with element name patterns.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
