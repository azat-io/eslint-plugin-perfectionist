import type { CommonPartitionOptions } from './common-partition-options'
import type { CommonGroupsOptions } from './common-groups-options'
import type { CommonOptions } from './common-options'

export type AllCommonOptions<
  CustomTypeOption extends string,
  AdditionalSortOptions,
  CustomGroupMatchOptions,
> = CommonGroupsOptions<
  CustomTypeOption,
  AdditionalSortOptions,
  CustomGroupMatchOptions
> &
  CommonOptions<CustomTypeOption, AdditionalSortOptions> &
  CommonPartitionOptions
