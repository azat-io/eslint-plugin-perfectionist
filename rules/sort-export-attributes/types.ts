import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
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
  {
    /**
     * Custom groups for organizing import attributes. Allows defining groups
     * based on attribute names and values.
     */
    customGroups: CustomGroupsOption<SingleCustomGroup>

    /**
     * Partition import attributes by comment delimiters. Attributes separated
     * by specific comments are sorted independently.
     */
    partitionByComment: PartitionByCommentOption

    /**
     * Controls the placement of newlines between different groups of import
     * attributes.
     */
    newlinesBetween: NewlinesBetweenOption

    /**
     * Defines the order and grouping of import attributes. Attributes are
     * sorted within their groups and groups are ordered as specified.
     */
    groups: GroupsOptions<Group>

    /**
     * Whether to partition import attributes by newlines. When true, attributes
     * separated by empty lines are sorted independently.
     */
    partitionByNewLine: boolean
  } & CommonOptions
>[]

export type SortExportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>
