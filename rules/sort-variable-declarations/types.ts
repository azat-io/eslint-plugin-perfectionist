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

type Group = 'unknown' | string
