import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions } from '../../types/common-options'

export type Options = Partial<
  CommonGroupsOptions<SingleCustomGroup, Record<string, never>> &
    CommonPartitionOptions &
    CommonOptions
>[]

/** Additional configuration for a single custom group. */
type SingleCustomGroup = Record<string, never>
