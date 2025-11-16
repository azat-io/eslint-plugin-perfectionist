import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { SortingNode } from '../../types/sorting-node'

import { regexJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    customGroups: CustomGroupsOption<SingleCustomGroup>
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    sortOnParameters: boolean
    sortOnProperties: boolean
    sortOnAccessors: boolean
    sortOnMethods: boolean
    sortOnClasses: boolean
  } & CommonPartitionOptions &
    CommonOptions
>[]

export interface SingleCustomGroup {
  elementNamePattern?: RegexOption
}

export type SortDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

type Group = 'unknown' | string

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
}
