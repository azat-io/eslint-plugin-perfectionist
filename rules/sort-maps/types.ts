import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  CommonOptions,
  GroupOptions,
} from '../../types/common-options'

import { elementNamePatternJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: string
    }
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    newlinesBetween: 'ignore' | 'always' | 'never'
    partitionByComment: PartitionByCommentOption
    groups: GroupOptions<Group>
    partitionByNewLine: boolean
    customGroups: CustomGroup[]
  } & CommonOptions
>[]

export interface SingleCustomGroup {
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
  elementNamePattern: elementNamePatternJsonSchema,
}
