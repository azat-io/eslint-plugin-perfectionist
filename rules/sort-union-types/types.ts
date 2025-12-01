import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'

import { buildCustomGroupSelectorJsonSchema } from '../../utils/json-schemas/common-groups-json-schemas'

/**
 * Configuration options for the sort-union-types rule.
 *
 * Controls how TypeScript union type members are sorted.
 */
export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup, Record<string, never>, TypeOption> &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/**
 * Union type of all available selectors for union type members.
 *
 * Selectors categorize different kinds of TypeScript types that can appear in a
 * union, enabling fine-grained control over sorting.
 */
export type Selector = (typeof allSelectors)[number]

/** Additional configuration for a single custom group. */
interface SingleCustomGroup {
  /**
   * The selector type this group matches. Determines what kind of type members
   * belong to this group.
   */
  selector?: Selector
}

/**
 * Array of all available selectors for union type members.
 *
 * Used for validation and configuration in the ESLint rule.
 */
export let allSelectors = [
  'intersection',
  'conditional',
  'function',
  'operator',
  'keyword',
  'literal',
  'nullish',
  'import',
  'object',
  'named',
  'tuple',
  'union',
] as const

/**
 * JSON Schema definitions for single custom group configurations.
 *
 * Provides additional schema properties specific to the sort-union-types rule.
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
}
