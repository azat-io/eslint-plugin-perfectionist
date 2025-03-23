import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  PartitionByCommentOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

export type Options = Partial<
  {
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'values-first' | 'types-first' | 'mixed'
    customGroups: CustomGroupsOption<SingleCustomGroup>
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

export type SingleCustomGroup = {
  modifiers?: Modifier[]
  selector?: Selector
} & {
  elementNamePattern?: RegexOption
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

export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: regexJsonSchema,
}
