import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
  TypeOption,
} from '../../types/common-options'

import { elementNamePatternJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    useConfigurationIf: {
      allNamesMatchPattern?: string
    }
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    customGroups: CustomGroup[]
    type: TypeOption
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
