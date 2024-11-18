import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

export type SortClassesOptions = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
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
export type CustomGroup = (
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
type NonDeclarePropertyGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${ReadonlyModifierPrefix}${DecoratedModifierPrefix}${OptionalModifierPrefix}${PropertySelector}`
type FunctionPropertyGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticModifierPrefix}${OverrideModifierPrefix}${ReadonlyModifierPrefix}${DecoratedModifierPrefix}${AsyncModifierPrefix}${FunctionPropertySelector}`
type MethodGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${DecoratedModifierPrefix}${AsyncModifierPrefix}${OptionalModifierPrefix}${MethodSelector}`
type DeclarePropertyGroup =
  `${DeclareModifierPrefix}${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${ReadonlyModifierPrefix}${OptionalModifierPrefix}${PropertySelector}`
type GetMethodOrSetMethodGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${DecoratedModifierPrefix}${GetMethodOrSetMethodSelector}`

type AccessorPropertyGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${DecoratedModifierPrefix}${AccessorPropertySelector}`
type AdvancedSingleCustomGroup<T extends Selector> = {
  decoratorNamePattern?: string
  elementValuePattern?: string
  elementNamePattern?: string
} & BaseSingleCustomGroup<T>
type PublicOrProtectedOrPrivateModifierPrefix = WithDashSuffixOrEmpty<
  ProtectedModifier | PrivateModifier | PublicModifier
>
interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}
type IndexSignatureGroup =
  `${StaticModifierPrefix}${ReadonlyModifierPrefix}${IndexSignatureSelector}`
type PublicOrProtectedOrPrivateModifier =
  | ProtectedModifier
  | PrivateModifier
  | PublicModifier
type StaticOrAbstractModifierPrefix = WithDashSuffixOrEmpty<
  AbstractModifier | StaticModifier
>
type ConstructorGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${ConstructorSelector}`
type GetMethodOrSetMethodSelector = GetMethodSelector | SetMethodSelector
type DecoratedModifierPrefix = WithDashSuffixOrEmpty<DecoratedModifier>

type OverrideModifierPrefix = WithDashSuffixOrEmpty<OverrideModifier>

type OptionalModifierPrefix = WithDashSuffixOrEmpty<OptionalModifier>

type ReadonlyModifierPrefix = WithDashSuffixOrEmpty<ReadonlyModifier>
type DeclareModifierPrefix = WithDashSuffixOrEmpty<DeclareModifier>
type StaticModifierPrefix = WithDashSuffixOrEmpty<StaticModifier>
type AsyncModifierPrefix = WithDashSuffixOrEmpty<AsyncModifier>
type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''
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

export let customGroupSortJsonSchema: Record<string, JSONSchema4> = {
  type: {
    description: 'Custom group sort type.',
    type: 'string',
    enum: ['alphabetical', 'line-length', 'natural', 'unsorted'],
  },
  order: {
    description: 'Custom group sort order.',
    type: 'string',
    enum: ['desc', 'asc'],
  },
}

export let customGroupNameJsonSchema: Record<string, JSONSchema4> = {
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
}

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  selector: {
    description: 'Selector filter.',
    type: 'string',
    enum: allSelectors,
  },
  modifiers: {
    description: 'Modifier filters.',
    type: 'array',
    items: {
      type: 'string',
      enum: allModifiers,
    },
  },
  elementNamePattern: {
    description: 'Element name pattern filter.',
    type: 'string',
  },
  elementValuePattern: {
    description: 'Element value pattern filter for properties.',
    type: 'string',
  },
  decoratorNamePattern: {
    description: 'Decorator name pattern filter.',
    type: 'string',
  },
}
