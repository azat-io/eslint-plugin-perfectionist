import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'

import { buildCustomGroupSelectorJsonSchema } from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-variable-declarations rule.
 *
 * Controls how multiple variable declarations in a single statement are sorted,
 * such as `const a = 1, b, c = 3;`.
 */
export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

/**
 * Union type of all available selectors for variable declarations.
 *
 * Distinguishes between variables with and without initial values.
 */
export type Selector = UninitializedSelector | InitializedSelector

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * The selector type this group matches. Can be 'initialized' for variables
   * with values or 'uninitialized' for variables without.
   */
  selector?: Selector
}

/**
 * Selector for uninitialized variables.
 *
 * Matches variable declarations without initial values, like `b` in `const a =
 * 1, b, c = 3;`.
 */
type UninitializedSelector = 'uninitialized'

/**
 * Selector for initialized variables.
 *
 * Matches variable declarations with initial values, like `a = 1` and `c = 3`
 * in `const a = 1, b, c = 3;`.
 */
type InitializedSelector = 'initialized'

/**
 * Array of all available selectors for variable declarations.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors: Selector[] = ['initialized', 'uninitialized']

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the
 * sort-variable-declarations rule.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
