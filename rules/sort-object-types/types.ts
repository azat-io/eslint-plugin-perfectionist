import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'
import type { TSESTree } from '@typescript-eslint/types'

import type {
  DeprecatedCustomGroupsOption,
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  FallbackSortOption,
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
    customGroups:
      | CustomGroupsOption<
          SingleCustomGroup,
          {
            fallbackSort?: { sortBy?: 'value' | 'name' } & FallbackSortOption
          }
        >
      | DeprecatedCustomGroupsOption
    useConfigurationIf: {
      declarationMatchesPattern?: RegexOption
      allNamesMatchPattern?: RegexOption
    }
    fallbackSort: { sortBy?: 'value' | 'name' } & FallbackSortOption
    /**
     * @deprecated for {@link `groups`}
     */
    groupKind: 'required-first' | 'optional-first' | 'mixed'
    partitionByComment: PartitionByCommentOption
    newlinesBetween: NewlinesBetweenOption
    groups: GroupsOptions<Group>
    partitionByNewLine: boolean
    /**
     * @deprecated for {@link `useConfigurationIf.declarationMatchesPattern`}
     */
    ignorePattern: RegexOption
    sortBy: 'value' | 'name'
  } & Omit<CommonOptions, 'fallbackSort'>
>[]

export type SingleCustomGroup = (
  | ({
      elementValuePattern?: RegexOption
      sortBy?: 'value' | 'name'
    } & BaseSingleCustomGroup<PropertySelector>)
  | BaseSingleCustomGroup<IndexSignatureSelector>
  | BaseSingleCustomGroup<MultilineSelector>
  | BaseSingleCustomGroup<MethodSelector>
  | BaseSingleCustomGroup<MemberSelector>
) &
  ElementNamePatternFilterCustomGroup

export type Selector =
  | IndexSignatureSelector
  | MultilineSelector
  | PropertySelector
  | MemberSelector
  | MethodSelector

export type Modifier = MultilineModifier | RequiredModifier | OptionalModifier

/**
 * Only used in code as well
 */
interface AllowedModifiersPerSelector {
  property: MultilineModifier | OptionalModifier | RequiredModifier
  member: MultilineModifier | OptionalModifier | RequiredModifier
  method: MultilineModifier | OptionalModifier | RequiredModifier
  multiline: OptionalModifier | RequiredModifier
  'index-signature': never
}

type IndexSignatureGroup = JoinWithDash<
  [
    OptionalModifier,
    RequiredModifier,
    MultilineModifier,
    IndexSignatureSelector,
  ]
>

/**
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group =
  | IndexSignatureGroup
  | MultilineGroup
  | PropertyGroup
  | MethodGroup
  | MemberGroup
  | 'unknown'
  | string

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type PropertyGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineModifier, PropertySelector]
>

type MemberGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineModifier, MemberSelector]
>

type MethodGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineModifier, MethodSelector]
>

/**
 * @deprecated For {@link `MultilineModifier`}
 */
type MultilineGroup = JoinWithDash<
  [OptionalModifier, RequiredModifier, MultilineSelector]
>

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: RegexOption
}

type IndexSignatureSelector = 'index-signature'

/**
 * @deprecated For {@link `MultilineModifier`}
 */
type MultilineSelector = 'multiline'

type MultilineModifier = 'multiline'

type RequiredModifier = 'required'

type OptionalModifier = 'optional'

type PropertySelector = 'property'

type MemberSelector = 'member'

type MethodSelector = 'method'

export let allSelectors: Selector[] = [
  'index-signature',
  'member',
  'method',
  'multiline',
  'property',
]

export let allModifiers: Modifier[] = ['optional', 'required', 'multiline']

export let sortByJsonSchema: JSONSchema4 = {
  enum: ['name', 'value'],
  type: 'string',
}

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
  sortBy: sortByJsonSchema,
}

export interface SortObjectTypesSortingNode
  extends SortingNode<TSESTree.TypeElement> {
  groupKind: 'required' | 'optional'
  value: string | null
}
