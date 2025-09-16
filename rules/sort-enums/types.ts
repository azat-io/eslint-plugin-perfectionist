import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import { regexJsonSchema } from '../../utils/common-json-schemas'

/**
 * Configuration options for the sort-enums rule.
 *
 * This rule enforces consistent ordering of TypeScript enum members to improve
 * code readability and maintainability.
 */
export type Options = Partial<
  {
    /**
     * Custom groups for organizing enum members. Allows defining groups based
     * on member name or value patterns.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Partition enum members by comment delimiters. Members separated by
     * specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of enum
     * members.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Whether to sort enum members by their values instead of names. When true,
     * compares enum values; when false, compares enum member names.
     *
     * @default false
     */
    sortByValue: 'ifNumericEnum' | boolean

    /**
     * Defines the order and grouping of enum members. Members are sorted within
     * their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition enum members by newlines. When true, members
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean
  } & CommonOptions
>[]

/**
 * Defines a custom group for enum member categorization.
 *
 * Custom groups allow fine-grained control over how enum members are grouped
 * and sorted based on their names or values.
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match enum member values. Members with values
   * matching this pattern will be included in this custom group.
   */
  elementValuePattern?: RegexOption

  /**
   * Regular expression pattern to match enum member names. Members with names
   * matching this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Represents a group identifier for enum member categorization. Can be
 * 'unknown' for uncategorized members or a custom group name.
 */
type Group = 'unknown' | string

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
