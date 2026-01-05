import type { CommonPartitionOptions } from './common-partition-options'
import type { CommonGroupsOptions } from './common-groups-options'
import type { CommonOptions } from './common-options'

export type AllCommonOptions<
  CustomTypeOption extends string,
  AdditionalSortProperties,
  CustomGroupMatchOptions,
> = CommonGroupsOptions<
  CustomTypeOption,
  AdditionalSortProperties,
  CustomGroupMatchOptions
> &
  CommonOptions<CustomTypeOption, AdditionalSortProperties> &
  CommonPartitionOptions
