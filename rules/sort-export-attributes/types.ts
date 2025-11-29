import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup, Record<string, never>> &
    CommonPartitionOptions &
    CommonOptions
>[]

export type SortExportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>

/** Additional configuration for a single custom group. */
type SingleCustomGroup = Record<string, unknown>
