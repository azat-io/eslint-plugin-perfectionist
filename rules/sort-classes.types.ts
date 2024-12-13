import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { WithDashSuffixOrEmpty, Join } from '../typings'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../utils/common-json-schemas'

export type SortClassesOptions = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    ignoreCallbackDependenciesPatterns: string[]
    locales: NonNullable<Intl.LocalesArgument>
    partitionByNewLine: boolean
    customGroups: CustomGroup[]
    groups: (Group[] | Group)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
  }>,
]

export type SingleCustomGroup =
  | AdvancedSingleCustomGroup<FunctionPropertySelector>
  | AdvancedSingleCustomGroup<AccessorPropertySelector>
  | BaseSingleCustomGroup<IndexSignatureSelector>
  | AdvancedSingleCustomGroup<GetMethodSelector>
  | AdvancedSingleCustomGroup<SetMethodSelector>
  | AdvancedSingleCustomGroup<PropertySelector>
  | BaseSingleCustomGroup<StaticBlockSelector>
  | BaseSingleCustomGroup<ConstructorSelector>
  | AdvancedSingleCustomGroup<MethodSelector>

export type NonDeclarePropertyGroup = Join<
  [
    PublicOrProtectedOrPrivateModifierPrefix,
    StaticOrAbstractModifierPrefix,
    OverrideModifierPrefix,
    ReadonlyModifierPrefix,
    DecoratedModifierPrefix,
    OptionalModifierPrefix,
    PropertySelector,
  ]
>

export type FunctionPropertyGroup = Join<
  [
    PublicOrProtectedOrPrivateModifierPrefix,
    StaticModifierPrefix,
    OverrideModifierPrefix,
    ReadonlyModifierPrefix,
    DecoratedModifierPrefix,
    AsyncModifierPrefix,
    FunctionPropertySelector,
  ]
>

export type MethodGroup = Join<
  [
    PublicOrProtectedOrPrivateModifierPrefix,
    StaticOrAbstractModifierPrefix,
    OverrideModifierPrefix,
    DecoratedModifierPrefix,
    AsyncModifierPrefix,
    OptionalModifierPrefix,
    MethodSelector,
  ]
>

export type Selector =
  | AccessorPropertySelector
  | FunctionPropertySelector
  | IndexSignatureSelector
  | ConstructorSelector
  | StaticBlockSelector
  | GetMethodSelector
  | SetMethodSelector
  | PropertySelector
  | MethodSelector

export type DeclarePropertyGroup = Join<
  [
    DeclareModifierPrefix,
    PublicOrProtectedOrPrivateModifierPrefix,
    StaticOrAbstractModifierPrefix,
    ReadonlyModifierPrefix,
    OptionalModifierPrefix,
    PropertySelector,
  ]
>

export type GetMethodOrSetMethodGroup = Join<
  [
    PublicOrProtectedOrPrivateModifierPrefix,
    StaticOrAbstractModifierPrefix,
    OverrideModifierPrefix,
    DecoratedModifierPrefix,
    GetMethodOrSetMethodSelector,
  ]
>

export type Modifier =
  | PublicOrProtectedOrPrivateModifier
  | DecoratedModifier
  | AbstractModifier
  | OverrideModifier
  | OptionalModifier
  | ReadonlyModifier
  | DeclareModifier
  | StaticModifier
  | AsyncModifier

export type AccessorPropertyGroup = Join<
  [
    PublicOrProtectedOrPrivateModifierPrefix,
    StaticOrAbstractModifierPrefix,
    OverrideModifierPrefix,
    DecoratedModifierPrefix,
    AccessorPropertySelector,
  ]
>

export type IndexSignatureGroup = Join<
  [StaticModifierPrefix, ReadonlyModifierPrefix, IndexSignatureSelector]
>

export type ConstructorGroup = Join<
  [PublicOrProtectedOrPrivateModifierPrefix, ConstructorSelector]
>

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

/**
 * Only used in code as well
 */
interface AllowedModifiersPerSelector {
  property:
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | ReadonlyModifier
    | OptionalModifier
    | DeclareModifier
    | StaticModifier
  method:
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | OptionalModifier
    | StaticModifier
    | AsyncModifier
  'function-property':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | OverrideModifier
    | ReadonlyModifier
    | StaticModifier
    | AsyncModifier
  'accessor-property':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | StaticModifier
  'set-method':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | StaticModifier
  'get-method': AllowedModifiersPerSelector['set-method']
  'index-signature': ReadonlyModifier | StaticModifier
  constructor: PublicOrProtectedOrPrivateModifier
  'static-block': never
}

/**
 * Some invalid combinations are still handled by this type, such as
 * - private abstract X
 * - abstract decorated X
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group =
  | GetMethodOrSetMethodGroup
  | NonDeclarePropertyGroup
  | AccessorPropertyGroup
  | FunctionPropertyGroup
  | DeclarePropertyGroup
  | IndexSignatureGroup
  | ConstructorGroup
  | StaticBlockGroup
  | MethodGroup
  | 'unknown'
  | string

type CustomGroup = (
  | {
      order?: SortClassesOptions[0]['order']
      type?: SortClassesOptions[0]['type']
    }
  | {
      type?: 'unsorted'
    }
) &
  (SingleCustomGroup | AnyOfCustomGroup) & {
    groupName: string
  }

type AdvancedSingleCustomGroup<T extends Selector> = {
  decoratorNamePattern?: string
  elementValuePattern?: string
  elementNamePattern?: string
} & BaseSingleCustomGroup<T>

type Join<T extends string[]> = T extends [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? `${First}${Join<Rest>}`
  : ''

type PublicOrProtectedOrPrivateModifierPrefix = WithDashSuffixOrEmpty<
  ProtectedModifier | PrivateModifier | PublicModifier
>

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type PublicOrProtectedOrPrivateModifier =
  | ProtectedModifier
  | PrivateModifier
  | PublicModifier

type StaticOrAbstractModifierPrefix = WithDashSuffixOrEmpty<
  AbstractModifier | StaticModifier
>

type GetMethodOrSetMethodSelector = GetMethodSelector | SetMethodSelector

type DecoratedModifierPrefix = WithDashSuffixOrEmpty<DecoratedModifier>

type OverrideModifierPrefix = WithDashSuffixOrEmpty<OverrideModifier>

type OptionalModifierPrefix = WithDashSuffixOrEmpty<OptionalModifier>

type ReadonlyModifierPrefix = WithDashSuffixOrEmpty<ReadonlyModifier>

type DeclareModifierPrefix = WithDashSuffixOrEmpty<DeclareModifier>

type StaticModifierPrefix = WithDashSuffixOrEmpty<StaticModifier>

type AsyncModifierPrefix = WithDashSuffixOrEmpty<AsyncModifier>

type FunctionPropertySelector = 'function-property'

type AccessorPropertySelector = 'accessor-property'

type StaticBlockGroup = `${StaticBlockSelector}`

type IndexSignatureSelector = 'index-signature'

type StaticBlockSelector = 'static-block'

type ConstructorSelector = 'constructor'

type GetMethodSelector = 'get-method'

type SetMethodSelector = 'set-method'

type ProtectedModifier = 'protected'

type DecoratedModifier = 'decorated'

type AbstractModifier = 'abstract'

type OverrideModifier = 'override'

type ReadonlyModifier = 'readonly'

type OptionalModifier = 'optional'

type PropertySelector = 'property'

type PrivateModifier = 'private'

type DeclareModifier = 'declare'

type PublicModifier = 'public'

type StaticModifier = 'static'

type MethodSelector = 'method'

type AsyncModifier = 'async'

export let allSelectors: Selector[] = [
  'accessor-property',
  'index-signature',
  'constructor',
  'static-block',
  'get-method',
  'set-method',
  'function-property',
  'property',
  'method',
]

export let allModifiers: Modifier[] = [
  'async',
  'protected',
  'private',
  'public',
  'static',
  'abstract',
  'override',
  'readonly',
  'decorated',
  'declare',
  'optional',
]

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  elementValuePattern: {
    description: 'Element value pattern filter for properties.',
    type: 'string',
  },
  decoratorNamePattern: {
    description: 'Decorator name pattern filter.',
    type: 'string',
  },
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: elementNamePatternJsonSchema,
}
