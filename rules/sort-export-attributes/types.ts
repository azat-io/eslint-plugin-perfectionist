import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

export type SortExportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>

/**
 * Configuration for a single custom group in import attributes sorting.
 *
 * Allows defining custom groups based on attribute name patterns.
 */
type SingleCustomGroup = Record<string, unknown>
