import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'

export type Options = Partial<
  CommonGroupsOptions<CustomGroupMatchOptions, object, TypeOption> &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

/** Match options for a custom group. */
type CustomGroupMatchOptions = object
