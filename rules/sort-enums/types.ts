import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  TypeOption,
} from '../../types/common-options'

import {
  elementValuePatternJsonSchema,
  elementNamePatternJsonSchema,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    forceNumericSort: boolean
    sortByValue: boolean
    type: TypeOption
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementValuePattern?: string
  elementNamePattern?: string
}

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementValuePattern: elementValuePatternJsonSchema,
  elementNamePattern: elementNamePatternJsonSchema,
}
