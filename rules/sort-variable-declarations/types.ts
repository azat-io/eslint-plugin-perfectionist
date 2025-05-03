import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'

export type Options = Partial<
  {
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
  } & CommonOptions
>[]

export type Selector = UninitializedSelector | InitializedSelector

type UninitializedSelector = 'uninitialized'

type Group = 'unknown' | Selector | string

type InitializedSelector = 'initialized'
