import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { JoinWithDash } from '../typings'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../utils/common-json-schemas'

export type Options = Partial<{
  customGroups: Record<string, string[] | string> | CustomGroup[]
  useConfigurationIf: {
    allNamesMatchPattern?: string
  }
  type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
  /**
   * @deprecated for {@link `groups`}
   */
  groupKind: 'required-first' | 'optional-first' | 'mixed'
  partitionByComment: string[] | boolean | string
  newlinesBetween: 'ignore' | 'always' | 'never'
  specialCharacters: 'remove' | 'trim' | 'keep'
  locales: NonNullable<Intl.LocalesArgument>
  groups: (Group[] | Group)[]
  partitionByNewLine: boolean
  ignorePattern: string[]
  order: 'desc' | 'asc'
  ignoreCase: boolean
  alphabet: string
}>[]

export type SingleCustomGroup = (
  | BaseSingleCustomGroup<IndexSignatureSelector>
  | BaseSingleCustomGroup<MultilineSelector>
  | BaseSingleCustomGroup<PropertySelector>
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

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

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

type CustomGroup = (
  | {
      order?: Options[0]['order']
      type?: Options[0]['type']
    }
  | {
      type?: 'unsorted'
    }
) &
  (SingleCustomGroup | AnyOfCustomGroup) & {
    groupName: string
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
  elementNamePattern?: string
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

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: elementNamePatternJsonSchema,
}
