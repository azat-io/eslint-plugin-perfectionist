import type {
  PartitionByCommentOption,
  CommonOptions,
} from '../../types/common-options'

export type Options = Partial<
  {
    groupKind: 'values-first' | 'types-first' | 'mixed'
    partitionByComment: PartitionByCommentOption
    partitionByNewLine: boolean
  } & CommonOptions
>[]
