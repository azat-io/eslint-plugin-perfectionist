import type {
  PartitionByCommentOption,
  CommonOptions,
  GroupsOptions,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

export type Options = Partial<
  {
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'values-first' | 'types-first' | 'mixed'
    partitionByComment: PartitionByCommentOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
  } & CommonOptions
>[]

export type Modifier = ValueModifier | TypeModifier

export type Selector = ExportSelector

type ExportGroup = JoinWithDash<[ValueModifier, TypeModifier, ExportSelector]>

type Group = ExportGroup | 'unknown' | string

type ExportSelector = 'export'

type ValueModifier = 'value'

type TypeModifier = 'type'
