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
 * Configuration options for the sort-maps rule.
 *
 * This rule enforces consistent ordering of Map elements to improve code
 * readability and maintainability.
 */
export type Options = Partial<
  {
    /**
     * Conditional configuration based on pattern matching. Allows applying the
     * rule only when specific conditions are met.
     */
    useConfigurationIf: {
      /**
       * Regular expression pattern to match against all Map element keys. The
       * rule is only applied when all keys match this pattern.
       */
      allNamesMatchPattern?: RegexOption
    }

    /**
     * Custom groups for organizing Map elements. Allows defining groups based
     * on key patterns.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Controls the placement of newlines between different groups of Map
     * elements.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of Map elements. Elements are sorted
     * within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>
  } & CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Defines a custom group for Map element categorization.
 *
 * Custom groups allow fine-grained control over how Map elements are grouped
 * and sorted based on their key names.
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match Map element keys. Elements with keys
   * matching this pattern will be included in this custom group.
   */
  elementNamePattern?: RegexOption
}

/**
 * Represents a group identifier for Map element categorization. Can be
 * 'unknown' for uncategorized elements or a custom group name.
 */
type Group = 'unknown' | string

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
}
