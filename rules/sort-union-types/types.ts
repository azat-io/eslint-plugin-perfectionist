import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'

export type Options = [
  Partial<
    {
      partitionByComment: PartitionByCommentOption
      newlinesBetween: NewlinesBetweenOption
      groups: GroupsOptions<Group>
      partitionByNewLine: boolean
    } & CommonOptions
  >,
]

type Group =
  | 'intersection'
  | 'conditional'
  | 'function'
  | 'operator'
  | 'keyword'
  | 'literal'
  | 'nullish'
  | 'unknown'
  | 'import'
  | 'object'
  | 'named'
  | 'tuple'
  | 'union'
