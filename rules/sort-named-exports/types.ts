import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
} from '../../types/common-options'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  {
    groupKind: 'values-first' | 'types-first' | 'mixed'
    partitionByComment: PartitionByCommentOption
    partitionByNewLine: boolean
    ignoreAlias: boolean
  } & CommonOptions
>[]

export interface SortNamedExportsSortingNode
  extends SortingNode<TSESTree.ExportSpecifier> {
  groupKind: 'value' | 'type'
}
