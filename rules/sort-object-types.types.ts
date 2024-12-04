import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../utils/common-json-schemas'

export type Options = [
  Partial<{
    customGroups: Record<string, string[] | string> | CustomGroup[]
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
  }>,
]

export type SingleCustomGroup = (
  | BaseSingleCustomGroup<IndexSignatureSelector>
  | BaseSingleCustomGroup<MultilineSelector>
  | BaseSingleCustomGroup<PropertySelector>
  | BaseSingleCustomGroup<MethodSelector>
  | BaseSingleCustomGroup<MemberSelector>
) &
  ElementNamePatternFilterCustomGroup

export type CustomGroup = (
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

type IndexSignatureGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MultilineModifierPrefix}${IndexSignatureSelector}`

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

type PropertyGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MultilineModifierPrefix}${PropertySelector}`

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type MemberGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MultilineModifierPrefix}${MemberSelector}`

type MethodGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MultilineModifierPrefix}${MethodSelector}`

type MultilineGroup =
  `${OptionalModifierPrefix | RequiredModifierPrefix}${MultilineSelector}`

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: string
}

type MultilineModifierPrefix = WithDashSuffixOrEmpty<MultilineModifier>

type RequiredModifierPrefix = WithDashSuffixOrEmpty<RequiredModifier>

type OptionalModifierPrefix = WithDashSuffixOrEmpty<OptionalModifier>

type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''

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
