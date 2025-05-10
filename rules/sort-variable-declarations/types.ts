import type {
  PartitionByCommentOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'

export type Options = Partial<
  {
    partitionByComment: PartitionByCommentOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
  } & CommonOptions
>[]

export type Selector = UninitializedSelector | InitializedSelector

type UninitializedSelector = 'uninitialized'

type Group = 'unknown' | Selector | string

type InitializedSelector = 'initialized'
