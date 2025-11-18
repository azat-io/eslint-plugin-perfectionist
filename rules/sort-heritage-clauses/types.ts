import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions, RegexOption } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'

import { regexJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<
  CommonGroupsOptions<Group, SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

export interface SingleCustomGroup {
  elementNamePattern?: RegexOption
}

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
}
