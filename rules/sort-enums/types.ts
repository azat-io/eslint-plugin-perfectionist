import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'

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
     * Whether to sort enum members by their values instead of names. When
     * "always", compares enum values; when "never", compares enum member
     * names.
     *
     * @default ifNumericEnum
     */
    sortByValue: 'ifNumericEnum' | 'always' | 'never'
    /**
     * Controls the placement of newlines between different groups of enum
     * members.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of enum members. Members are sorted within
     * their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>
  } & CommonPartitionOptions &
    CommonOptions
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
