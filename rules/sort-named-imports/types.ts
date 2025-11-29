import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
} from '../../utils/json-schemas/common-groups-json-schemas'

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
  } & CommonGroupsOptions<SingleCustomGroup> &
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

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
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
}

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
}
