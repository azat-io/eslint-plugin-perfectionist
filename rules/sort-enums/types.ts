import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import { regexJsonSchema } from '../../utils/common-json-schemas'

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
 * Configuration options for the sort-enums rule.
 *
 * This rule enforces consistent ordering of TypeScript enum members to improve
 * code readability and maintainability.
 */
export type Options = Partial<
  {
    /**
     * Whether to sort enum members by their values instead of names. When
     * "always", compares enum values; when "never", compares enum member
     * names.
     *
     * @default ifNumericEnum
     */
    sortByValue: 'ifNumericEnum' | 'always' | 'never'
  } & CommonGroupsOptions<Group, SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

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
