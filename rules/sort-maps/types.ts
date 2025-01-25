import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
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
    customGroups: CustomGroupsOption<SingleCustomGroup>
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    type: TypeOption
  } & CommonOptions
>[]

export interface SingleCustomGroup {
  elementNamePattern?: string
}

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: elementNamePatternJsonSchema,
}
