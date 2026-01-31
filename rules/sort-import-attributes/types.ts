import type { TSESTree } from '@typescript-eslint/types'

import type { AllCommonOptions } from '../../types/all-common-options'
import type { TypeOption } from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  AllCommonOptions<TypeOption, AdditionalSortOptions, CustomGroupMatchOptions>
>[]

export type SortImportAttributesSortingNode =
  SortingNode<TSESTree.ImportAttribute>

/**
 * Match options for a custom group.
 */
type CustomGroupMatchOptions = object

type AdditionalSortOptions = object
