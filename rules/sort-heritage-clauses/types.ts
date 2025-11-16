import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'

import { regexJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    customGroups: CustomGroupsOption<SingleCustomGroup>
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
  } & CommonPartitionOptions &
    CommonOptions
>[]

export interface SingleCustomGroup {
  elementNamePattern?: RegexOption
}

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
}
