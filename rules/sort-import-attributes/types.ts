import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { CommonOptions, TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  CommonGroupsOptions<
    CustomGroupMatchOptions,
    Record<string, never>,
    TypeOption
  > &
    CommonOptions<TypeOption> &
    CommonPartitionOptions
>[]

export type SortImportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>

/** Match options for a custom group. */
type CustomGroupMatchOptions = Record<string, never>
