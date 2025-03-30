import type { TSESTree } from '@typescript-eslint/types'

import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  {
    partitionByComment: PartitionByCommentOption
    customGroups: DeprecatedCustomGroupsOption
    groups: GroupsOptions<Group>
    sortOnParameters: boolean
    sortOnProperties: boolean
    sortOnAccessors: boolean
    sortOnMethods: boolean
    sortOnClasses: boolean
  } & CommonOptions
>[]

export type SortDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

type Group = 'unknown' | string
