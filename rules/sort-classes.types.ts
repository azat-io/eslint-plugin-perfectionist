import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

type ProtectedModifier = 'protected'
type PrivateModifier = 'private'
type PublicModifier = 'public'
type PublicOrProtectedOrPrivateModifier =
  | ProtectedModifier
  | PrivateModifier
  | PublicModifier
type StaticModifier = 'static'
type AbstractModifier = 'abstract'
type OverrideModifier = 'override'
type ReadonlyModifier = 'readonly'
type DecoratedModifier = 'decorated'
type DeclareModifier = 'declare'
type OptionalModifier = 'optional'
export type Modifier =
  | PublicOrProtectedOrPrivateModifier
  | DecoratedModifier
  | AbstractModifier
  | OverrideModifier
  | OptionalModifier
  | ReadonlyModifier
  | DeclareModifier
  | StaticModifier

export const allModifiers: Modifier[] = [
  'protected',
  'private',
  'public',
  'static',
  'abstract',
  'override',
  'readonly',
  'decorated',
  'declare',
]

type ConstructorSelector = 'constructor'
type FunctionPropertySelector = 'function-property'
type PropertySelector = 'property'
type MethodSelector = 'method'
type GetMethodSelector = 'get-method'
type SetMethodSelector = 'set-method'
type IndexSignatureSelector = 'index-signature'
type StaticBlockSelector = 'static-block'
type AccessorPropertySelector = 'accessor-property'
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

export const allSelectors: Selector[] = [
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

type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''

type PublicOrProtectedOrPrivateModifierPrefix = WithDashSuffixOrEmpty<
  ProtectedModifier | PrivateModifier | PublicModifier
>

type OverrideModifierPrefix = WithDashSuffixOrEmpty<OverrideModifier>
type OptionalModifierPrefix = WithDashSuffixOrEmpty<OptionalModifier>
type ReadonlyModifierPrefix = WithDashSuffixOrEmpty<ReadonlyModifier>
type DecoratedModifierPrefix = WithDashSuffixOrEmpty<DecoratedModifier>
type DeclareModifierPrefix = WithDashSuffixOrEmpty<DeclareModifier>

type StaticOrAbstractModifierPrefix = WithDashSuffixOrEmpty<
  AbstractModifier | StaticModifier
>

type StaticModifierPrefix = WithDashSuffixOrEmpty<StaticModifier>

type MethodOrGetMethodOrSetMethodSelector =
  | GetMethodSelector
  | SetMethodSelector
  | MethodSelector

type ConstructorGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${ConstructorSelector}`
type FunctionPropertyGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticModifierPrefix}${OverrideModifierPrefix}${ReadonlyModifierPrefix}${DecoratedModifierPrefix}${FunctionPropertySelector}`
type DeclarePropertyGroup =
  `${DeclareModifierPrefix}${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${ReadonlyModifierPrefix}${OptionalModifierPrefix}${PropertySelector}`
type NonDeclarePropertyGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${ReadonlyModifierPrefix}${DecoratedModifierPrefix}${OptionalModifierPrefix}${PropertySelector}`
type MethodOrGetMethodOrSetMethodGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${DecoratedModifierPrefix}${OptionalModifierPrefix}${MethodOrGetMethodOrSetMethodSelector}`
type AccessorPropertyGroup =
  `${PublicOrProtectedOrPrivateModifierPrefix}${StaticOrAbstractModifierPrefix}${OverrideModifierPrefix}${DecoratedModifierPrefix}${AccessorPropertySelector}`
type IndexSignatureGroup =
  `${StaticModifierPrefix}${ReadonlyModifierPrefix}${IndexSignatureSelector}`
type StaticBlockGroup = `${StaticBlockSelector}`

/**
 * Some invalid combinations are still handled by this type, such as
 * - private abstract X
 * - abstract decorated X
 */
type Group =
  | MethodOrGetMethodOrSetMethodGroup
  | NonDeclarePropertyGroup
  | AccessorPropertyGroup
  | FunctionPropertyGroup
  | DeclarePropertyGroup
  | IndexSignatureGroup
  | ConstructorGroup
  | StaticBlockGroup
  | 'unknown'
  | string
interface AllowedModifiersPerSelector {
  property:
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | ReadonlyModifier
    | DeclareModifier
    | StaticModifier
  'accessor-property':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | StaticModifier
  'function-property':
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | OverrideModifier
    | ReadonlyModifier
    | StaticModifier
  method:
    | PublicOrProtectedOrPrivateModifier
    | DecoratedModifier
    | AbstractModifier
    | OverrideModifier
    | StaticModifier
  'index-signature': ReadonlyModifier | StaticModifier
  'set-method': AllowedModifiersPerSelector['method']
  'get-method': AllowedModifiersPerSelector['method']
  constructor: PublicOrProtectedOrPrivateModifier
  'static-block': never
}

export interface CustomGroupBlock {
  anyOf: SingleCustomGroup[]
}

interface BaseCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type AdvancedCustomGroup<T extends Selector> = {
  decoratorNamePattern?: string
  elementNamePattern?: string
} & BaseCustomGroup<T>

export type SingleCustomGroup =
  | AdvancedCustomGroup<FunctionPropertySelector>
  | AdvancedCustomGroup<AccessorPropertySelector>
  | BaseCustomGroup<IndexSignatureSelector>
  | AdvancedCustomGroup<GetMethodSelector>
  | AdvancedCustomGroup<SetMethodSelector>
  | AdvancedCustomGroup<PropertySelector>
  | BaseCustomGroup<StaticBlockSelector>
  | BaseCustomGroup<ConstructorSelector>
  | AdvancedCustomGroup<MethodSelector>

export type CustomGroup = (
  | {
      type?: 'alphabetical' | 'line-length' | 'natural'
      order?: 'desc' | 'asc'
    }
  | {
      type?: 'unsorted'
    }
) &
  (SingleCustomGroup | CustomGroupBlock) & {
    groupName: string
  }

export type SortClassesOptions = [
  Partial<{
    customGroups: { [key: string]: string[] | string } | CustomGroup[]
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    groups: (Group[] | Group)[]
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
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
    description: 'Element name pattern.',
    type: 'string',
  },
  decoratorNamePattern: {
    description: 'Decorator name pattern.',
    type: 'string',
  },
}

export const singleCustomGroupSortGroupSchema: Record<string, JSONSchema4> = {
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

export const singleCustomGroupNameGroupSchema: Record<string, JSONSchema4> = {
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
}
