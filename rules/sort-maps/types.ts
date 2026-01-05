import type { RegexOption, TypeOption } from '../../types/common-options'
import type { AllCommonOptions } from '../../types/all-common-options'

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
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortProperties,
    CustomGroupMatchOptions
  >
>[]

type AdditionalSortProperties = object

/** Match options for a custom group. */
type CustomGroupMatchOptions = object
