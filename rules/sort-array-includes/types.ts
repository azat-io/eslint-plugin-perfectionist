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
 * Configuration options for the sort-array-includes rule.
 *
 * This rule enforces the sorting of arrays passed to the `.includes()` method,
 * ensuring consistent ordering of array elements for better readability and
 * maintainability.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching. When specified, the
     * rule applies only if all array element names match the given pattern.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all array element names.
       * The rule is only applied when all names match this pattern.
       */
      allNamesMatchPattern?: RegexOption
    }

    /**
     * Custom groups for organizing array elements. Allows defining groups based
     * on element name patterns and selectors.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Partition array elements by comment delimiters. Elements separated by
     * specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of array
     * elements.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of array elements. Elements are sorted
     * within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition array elements by newlines. When true, elements
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean
  } & CommonOptions
>[]

/**
 * Defines a custom group for array element categorization.
 *
 * Custom groups allow fine-grained control over how array elements are grouped
 * and sorted based on their names and types.
 *
 * @example
 *   {
 *     "elementNamePattern": "^CONSTANT_",
 *     "selector": "literal"
 *   }
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match array element names. Elements matching
   * this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption

  /**
   * Specifies the type of array elements to include in this group. Can be
   * 'literal' for literal values or 'spread' for spread elements.
   */
  selector?: Selector
}

/**
 * Represents the type of array element selector. Used to distinguish between
 * literal values and spread elements in arrays.
 */
export type Selector = LiteralSelector | SpreadSelector

/**
 * Selector for literal array elements. Matches direct values like strings,
 * numbers, or identifiers in the array.
 */
type LiteralSelector = 'literal'

/**
 * Represents a group identifier for array element categorization. Can be
 * 'unknown' for uncategorized elements or a custom group name.
 */
type Group = 'unknown' | string

/**
 * Selector for spread elements in arrays. Matches spread syntax elements like
 * `...otherArray` in the array.
 */
type SpreadSelector = 'spread'

/**
 * Complete list of available selectors for array elements. Used for validation
 * and JSON schema generation.
 */
export let allSelectors: Selector[] = ['literal', 'spread']

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
