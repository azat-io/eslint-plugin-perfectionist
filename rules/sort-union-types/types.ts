import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'

export type Selector =
  | IntersectionSelector
  | ConditionalSelector
  | FunctionSelector
  | OperatorSelector
  | KeywordSelector
  | LiteralSelector
  | NullishSelector
  | ImportSelector
  | ObjectSelector
  | NamedSelector
  | TupleSelector
  | UnionSelector

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

type IntersectionSelector = 'intersection'

type Group = 'unknown' | Selector | string

type ConditionalSelector = 'conditional'

type FunctionSelector = 'function'

type OperatorSelector = 'operator'

type KeywordSelector = 'keyword'

type LiteralSelector = 'literal'

type NullishSelector = 'nullish'

type ImportSelector = 'import'

type ObjectSelector = 'object'

type NamedSelector = 'named'

type TupleSelector = 'tuple'

type UnionSelector = 'union'
