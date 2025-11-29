import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type { CommonPartitionOptions } from '../../types/common-partition-options'
import type { CommonOptions } from '../../types/common-options'
import type { CommonGroupsOptions } from '../../types/common-groups-options'
import type { SortingNode } from '../../types/sorting-node'

import { regexJsonSchema } from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    sortOnParameters: boolean
    sortOnProperties: boolean
    sortOnAccessors: boolean
    sortOnMethods: boolean
    sortOnClasses: boolean
  } & CommonGroupsOptions<SingleCustomGroup> &
    CommonPartitionOptions &
    CommonOptions
>[]

type SingleCustomGroup = Record<string, never>

export type SortDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementNamePattern: regexJsonSchema,
}
