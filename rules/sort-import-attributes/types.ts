import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { SortingNode } from '../../types/sorting-node'

import { regexJsonSchema } from '../../utils/common-json-schemas'

/**
 * Configuration for a single custom group in import attributes sorting.
 *
 * Allows defining custom groups based on attribute name patterns.
 */
export interface SingleCustomGroup {
  /**
   * Regular expression pattern to match against attribute names. Only
   * attributes with names matching this pattern will be included in the group.
   */
  elementNamePattern?: RegexOption

  /** The unique name identifier for this custom group. */
  groupName: string
}

/**
 * Union type of all possible group identifiers for import attributes.
 *
 * Groups are used to organize and sort related attributes together.
 */
export type Group = 'unknown' | string

/** JSON Schema for single custom group configurations. */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
  groupName: { type: 'string' },
}

export type Options = Partial<
  CommonGroupsOptions<Group, SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

export type SortImportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>
