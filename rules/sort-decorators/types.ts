import type { TSESTree } from '@typescript-eslint/types'

import type { AllCommonOptions } from '../../types/all-common-options'
import type { TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  {
    sortOnParameters: boolean
    sortOnProperties: boolean
    sortOnAccessors: boolean
    sortOnMethods: boolean
    sortOnClasses: boolean
  } & AllCommonOptions<
    TypeOption,
    AdditionalSortProperties,
    CustomGroupMatchOptions
  >
>[]

export type SortDecoratorsSortingNode = SortingNode<TSESTree.Decorator>

type AdditionalSortProperties = object

/** Match options for a custom group. */
type CustomGroupMatchOptions = object
