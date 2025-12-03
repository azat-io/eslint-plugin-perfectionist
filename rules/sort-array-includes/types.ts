import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  CommonOptions,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import { buildCustomGroupSelectorJsonSchema } from '../../utils/json-schemas/common-groups-json-schemas'

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
  } & CommonGroupsOptions<
    SingleCustomGroup,
    Record<string, never>,
    TypeOption
  > &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/**
 * Represents the type of array element selector. Used to distinguish between
 * literal values and spread elements in arrays.
 */
export type Selector = (typeof allSelectors)[number]

/**
 * Additional configuration for a single custom group.
 *
 * Custom groups allow fine-grained control over how array elements are grouped
 * and sorted based on their names and types.
 *
 * @example
 *   {
 *     "selector": "literal"
 *   }
 */
interface SingleCustomGroup {
  /**
   * Specifies the type of array elements to include in this group. Can be
   * 'literal' for literal values or 'spread' for spread elements.
   */
  selector?: Selector
}

/**
 * Complete list of available selectors for array elements. Used for validation
 * and JSON schema generation.
 */
export let allSelectors = ['literal', 'spread'] as const

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
