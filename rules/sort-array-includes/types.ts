import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

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
  } & CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Represents the type of array element selector. Used to distinguish between
 * literal values and spread elements in arrays.
 */
export type Selector = LiteralSelector | SpreadSelector

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
interface SingleCustomGroup {
  /**
   * Specifies the type of array elements to include in this group. Can be
   * 'literal' for literal values or 'spread' for spread elements.
   */
  selector?: Selector
}

/**
 * Selector for literal array elements. Matches direct values like strings,
 * numbers, or identifiers in the array.
 */
type LiteralSelector = 'literal'

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
