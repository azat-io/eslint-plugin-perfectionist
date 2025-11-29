import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

import { regexJsonSchema } from '../../utils/common-json-schemas'

/**
 * Configuration for a single custom group in import attributes sorting.
 *
 * Allows defining custom groups based on attribute name patterns.
 */
type SingleCustomGroup = Record<string, never>

/** JSON Schema for single custom group configurations. */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
}

export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

export type SortImportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>
