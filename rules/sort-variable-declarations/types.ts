import type {
  PartitionByCommentOption,
  CommonOptions,
} from '../../types/common-options'

export type Options = Partial<
  {
    partitionByComment: PartitionByCommentOption
    partitionByNewLine: boolean
  } & CommonOptions
>[]
