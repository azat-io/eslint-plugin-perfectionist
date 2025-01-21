import type {
  PartitionByCommentOption,
  CommonOptions,
} from '../../types/common-options'

export type Options = Partial<
  {
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    partitionByComment: PartitionByCommentOption
    partitionByNewLine: boolean
    forceNumericSort: boolean
    sortByValue: boolean
  } & CommonOptions
>[]
