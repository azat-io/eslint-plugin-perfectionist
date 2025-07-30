import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CustomGroupsOption,
  CommonOptions,
  GroupsOptions,
  RegexOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  regexJsonSchema,
} from '../../utils/common-json-schemas'

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

export type SortClassesOptions = [
  Partial<
    {
      customGroups: CustomGroupsOption<SingleCustomGroup>
      ignoreCallbackDependenciesPatterns: RegexOption
      partitionByComment: PartitionByCommentOption
      newlinesBetween: NewlinesBetweenOption
      groups: GroupsOptions<Group>
      partitionByNewLine: boolean
    } & CommonOptions
  >,
]

export type NonDeclarePropertyGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    ReadonlyModifier,
    DecoratedModifier,
    OptionalModifier,
    PropertySelector,
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

export type FunctionPropertyGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticModifier,
    OverrideModifier,
    ReadonlyModifier,
    DecoratedModifier,
    AsyncModifier,
    FunctionPropertySelector,
  ]
>

export type MethodGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    DecoratedModifier,
    AsyncModifier,
    OptionalModifier,
    MethodSelector,
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

export type DeclarePropertyGroup = JoinWithDash<
  [
    DeclareModifier,
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    ReadonlyModifier,
    OptionalModifier,
    PropertySelector,
  ]
>

export type GetMethodOrSetMethodGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    DecoratedModifier,
    GetMethodOrSetMethodSelector,
  ]
>

export type AccessorPropertyGroup = JoinWithDash<
  [
    PublicOrProtectedOrPrivateModifier,
    StaticOrAbstractModifier,
    OverrideModifier,
    DecoratedModifier,
    AccessorPropertySelector,
  ]
>

export type IndexSignatureGroup = JoinWithDash<
  [StaticModifier, ReadonlyModifier, IndexSignatureSelector]
>

export type ConstructorGroup = JoinWithDash<
  [PublicOrProtectedOrPrivateModifier, ConstructorSelector]
>

/** Only used in code as well */
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
 *
 * - Private abstract X
 * - Abstract decorated X Only used in code, so I don't know if it's worth
 *   maintaining this.
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

type AdvancedSingleCustomGroup<T extends Selector> = {
  decoratorNamePattern?: RegexOption
  elementValuePattern?: RegexOption
  elementNamePattern?: RegexOption
} & BaseSingleCustomGroup<T>

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type PublicOrProtectedOrPrivateModifier =
  | ProtectedModifier
  | PrivateModifier
  | PublicModifier

type GetMethodOrSetMethodSelector = GetMethodSelector | SetMethodSelector

type StaticOrAbstractModifier = AbstractModifier | StaticModifier

type FunctionPropertySelector = 'function-property'

type AccessorPropertySelector = 'accessor-property'

type IndexSignatureSelector = 'index-signature'

type StaticBlockGroup = StaticBlockSelector

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
 * Ideally, we should generate as many schemas as there are selectors, and
 * ensure that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  decoratorNamePattern: regexJsonSchema,
  elementValuePattern: regexJsonSchema,
  elementNamePattern: regexJsonSchema,
}
