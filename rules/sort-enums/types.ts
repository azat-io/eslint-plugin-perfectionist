import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  CommonOptions,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { SortingNodeWithDependencies } from '../../utils/sort-nodes-by-dependencies'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import { regexJsonSchema } from '../../utils/json-schemas/common-json-schemas'

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
  } & CommonGroupsOptions<
    SingleCustomGroup,
    Record<string, never>,
    TypeOption
  > &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

export interface SortEnumsSortingNode
  extends SortingNodeWithDependencies<TSESTree.TSEnumMember> {
  numericValue: number | null
  value: string | null
}

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * Regular expression pattern to match enum member values. Members with values
   * matching this pattern will be included in this custom group.
   */
  elementValuePattern?: RegexOption
}

/**
 * JSON schema definition for validating single custom group configurations.
 * Used by ESLint to validate rule options at configuration time.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementValuePattern: regexJsonSchema,
}
