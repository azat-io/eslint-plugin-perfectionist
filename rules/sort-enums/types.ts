import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'

import {
  elementValuePatternJsonSchema,
  elementNamePatternJsonSchema,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    newlinesBetween: 'ignore' | 'always' | 'never'
    partitionByComment: PartitionByCommentOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    customGroups: CustomGroup[]
    forceNumericSort: boolean
    sortByValue: boolean
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementValuePattern?: string
  elementNamePattern?: string
}

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

type CustomGroup = (
  | {
      order?: Options[0]['order']
      type?: Options[0]['type']
    }
  | {
      type?: 'unsorted'
    }
) &
  (SingleCustomGroup | AnyOfCustomGroup) & {
    groupName: string
  }

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementValuePattern: elementValuePatternJsonSchema,
  elementNamePattern: elementNamePatternJsonSchema,
}
