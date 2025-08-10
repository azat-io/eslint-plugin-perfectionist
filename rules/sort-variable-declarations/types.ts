import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import {
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-variable-declarations rule.
 *
 * Controls how multiple variable declarations in a single statement are sorted,
 * such as `const a = 1, b, c = 3;`.
 */
export type Options = Partial<
  {
    /**
     * Custom groups for organizing variable declarations. Allows defining
     * groups based on variable names and initialization status.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Partition variable declarations by comment delimiters. Declarations
     * separated by specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of variable
     * declarations.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of variable declarations. Declarations are
     * sorted within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition variable declarations by newlines. When true,
     * declarations separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean
  } & CommonOptions
>[]

/**
 * Configuration for a single custom group in variable declarations sorting.
 *
 * Allows defining custom groups based on variable names and selectors.
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match against variable names. Only variables
   * with names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption

  /**
   * The selector type this group matches. Can be 'initialized' for variables
   * with values or 'uninitialized' for variables without.
   */
  selector?: Selector
}

/**
 * Union type of all available selectors for variable declarations.
 *
 * Distinguishes between variables with and without initial values.
 */
export type Selector = UninitializedSelector | InitializedSelector

/**
 * Selector for uninitialized variables.
 *
 * Matches variable declarations without initial values, like `b` in `const a =
 * 1, b, c = 3;`.
 */
type UninitializedSelector = 'uninitialized'

/**
 * Union type of all possible group identifiers for variable declarations.
 *
 * Groups are used to organize and sort related declarations together. Can be
 * selector types, 'unknown' for unmatched declarations, or custom string
 * identifiers.
 */
type Group = 'unknown' | Selector | string

/**
 * Selector for initialized variables.
 *
 * Matches variable declarations with initial values, like `a = 1` and `c = 3`
 * in `const a = 1, b, c = 3;`.
 */
type InitializedSelector = 'initialized'

/**
 * Array of all available selectors for variable declarations.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = ['initialized', 'uninitialized']

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the
 * sort-variable-declarations rule, extending the base custom group schema with
 * element name patterns.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
