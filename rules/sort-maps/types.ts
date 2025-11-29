import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

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
  } & CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Defines a custom group for Map element categorization.
 *
 * Custom groups allow fine-grained control over how Map elements are grouped
 * and sorted based on their key names.
 */
type SingleCustomGroup = Record<string, never>
