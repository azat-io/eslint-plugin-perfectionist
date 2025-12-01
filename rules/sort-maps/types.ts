import type {
  CommonOptions,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
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
  } & CommonGroupsOptions<
    SingleCustomGroup,
    Record<string, never>,
    TypeOption
  > &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/** Additional configuration for a single custom group. */
type SingleCustomGroup = Record<string, never>
