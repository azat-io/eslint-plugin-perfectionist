import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'

import {
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
  } & CommonOptions
>[]

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

export type SingleCustomGroup = {
  elementNamePattern?: RegexOption
} & {
  selector?: Selector
}

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

export let allSelectors: Selector[] = [
  'intersection',
  'conditional',
  'function',
  'operator',
  'keyword',
  'literal',
  'nullish',
  'import',
  'object',
  'named',
  'tuple',
  'union',
]

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
