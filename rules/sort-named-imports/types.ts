import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<
  {
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'values-first' | 'types-first' | 'mixed'
    partitionByComment: PartitionByCommentOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    ignoreAlias: boolean
  } & CommonOptions
>[]

export interface SortNamedImportsSortingNode
  extends SortingNode<TSESTree.ImportClause> {
  groupKind: 'value' | 'type'
}

export type Modifier = ValueModifier | TypeModifier

export type Selector = ImportSelector

type ImportGroup = JoinWithDash<[ValueModifier, TypeModifier, ImportSelector]>

type Group = ImportGroup | 'unknown' | string

type ImportSelector = 'import'

type ValueModifier = 'value'

type TypeModifier = 'type'

export let allSelectors: Selector[] = ['import']
export let allModifiers: Modifier[] = ['value', 'type']
