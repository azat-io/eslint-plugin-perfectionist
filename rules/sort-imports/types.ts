import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  SpecialCharactersOption,
  NewlinesBetweenOption,
  FallbackSortOption,
  GroupsOptions,
  OrderOption,
  RegexOption,
  TypeOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'
import type { SortingNode } from '../../types/sorting-node'

export type Options = Partial<{
  customGroups: {
    value?: DeprecatedCustomGroupsOption
    type?: DeprecatedCustomGroupsOption
  }
  partitionByComment: PartitionByCommentOption
  specialCharacters: SpecialCharactersOption
  locales: NonNullable<Intl.LocalesArgument>
  newlinesBetween: NewlinesBetweenOption
  fallbackSort: FallbackSortOption
  internalPattern: RegexOption[]
  groups: GroupsOptions<Group>
  environment: 'node' | 'bun'
  partitionByNewLine: boolean
  sortSideEffects: boolean
  tsconfigRootDir?: string
  maxLineLength?: number
  ignoreCase: boolean
  order: OrderOption
  type: TypeOption
  alphabet: string
}>[]

export type Selector =
  | SideEffectStyleSelector
  | InternalTypeSelector
  | ExternalTypeSelector
  | SiblingTypeSelector
  | BuiltinTypeSelector
  | SideEffectSelector
  | ParentTypeSelector
  | IndexTypeSelector
  | ExternalSelector
  | InternalSelector
  | BuiltinSelector
  | SiblingSelector
  | ParentSelector
  | IndexSelector
  | StyleSelector
  | TypeSelector

export interface SortImportsSortingNode extends SortingNode {
  isIgnored: boolean
}

export type Group = ValueGroup | TypeGroup | 'unknown' | string

export type Modifier = TypeModifier

type TypeGroup = JoinWithDash<[TypeModifier, Selector]>

type SideEffectStyleSelector = 'side-effect-style'

/**
 * @deprecated for the modifier and selector
 */
type InternalTypeSelector = 'internal-type'

/**
 * @deprecated for the modifier and selector
 */
type ExternalTypeSelector = 'external-type'

type ValueGroup = JoinWithDash<[Selector]>

/**
 * @deprecated for the modifier and selector
 */
type SiblingTypeSelector = 'sibling-type'

/**
 * @deprecated for the modifier and selector
 */
type BuiltinTypeSelector = 'builtin-type'

type SideEffectSelector = 'side-effect'

/**
 * @deprecated for the modifier and selector
 */
type ParentTypeSelector = 'parent-type'

/**
 * @deprecated for the modifier and selector
 */
type IndexTypeSelector = 'index-type'

type ExternalSelector = 'external'

type InternalSelector = 'internal'

type BuiltinSelector = 'builtin'

type SiblingSelector = 'sibling'

type ParentSelector = 'parent'

type IndexSelector = 'index'

type StyleSelector = 'style'

type TypeModifier = 'type'

type TypeSelector = 'type'
