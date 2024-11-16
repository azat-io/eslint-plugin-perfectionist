import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

type DeclareModifier = 'declare'
type DecoratedModifier = 'decorated'
type DefaultModifier = 'default'
type ExportModifier = 'export'
type AsyncModifier = 'async'
export type Modifier =
  | DecoratedModifier
  | DeclareModifier
  | DefaultModifier
  | ExportModifier
  | AsyncModifier

type InterfaceSelector = 'interface'
type FunctionSelector = 'function'
type ClassSelector = 'class'
type TypeSelector = 'type'
type EnumSelector = 'enum'
export type Selector =
  // | NamespaceSelector
  | InterfaceSelector
  | FunctionSelector
  // | ModuleSelector
  | ClassSelector
  | TypeSelector
  | EnumSelector

type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''

type DeclareModifierPrefix = WithDashSuffixOrEmpty<DeclareModifier>
type DefaultModifierPrefix = WithDashSuffixOrEmpty<DefaultModifier>
type DecoratedModifierPrefix = WithDashSuffixOrEmpty<DecoratedModifier>
type ExportModifierPrefix = WithDashSuffixOrEmpty<ExportModifier>
type AsyncModifierPrefix = WithDashSuffixOrEmpty<AsyncModifier>

type NonDefaultInterfaceGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${InterfaceSelector}`
type DefaultInterfaceGroup =
  `${ExportModifierPrefix}${DefaultModifierPrefix}${InterfaceSelector}`
type DefaultFunctionGroup =
  `${ExportModifierPrefix}${DefaultModifierPrefix}${AsyncModifierPrefix}${FunctionSelector}`
type NonDefaultFunctionGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${FunctionSelector}`
type NonDefaultClassGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${DecoratedModifierPrefix}${ClassSelector}`
type DefaultClassGroup =
  `${ExportModifierPrefix}${DefaultModifierPrefix}${DecoratedModifierPrefix}${ClassSelector}`
type TypeGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${TypeSelector}`
type EnumGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${EnumSelector}`

/**
 * Only used in code, so I don't know if it's worth maintaining this.
 */
type Group =
  | NonDefaultInterfaceGroup
  | NonDefaultFunctionGroup
  | DefaultInterfaceGroup
  | DefaultFunctionGroup
  | NonDefaultClassGroup
  | DefaultClassGroup
  | EnumGroup
  | TypeGroup
  | 'unknown'
  | string

/**
 * Only used in code as well
 */
interface AllowedModifiersPerSelector {
  function: DeclareModifier | DefaultModifier | ExportModifier | AsyncModifier
  interface: DeclareModifier | DefaultModifier | ExportModifier
  class: DeclareModifier | DefaultModifier | ExportModifier
  namespace: DeclareModifier | ExportModifier
  module: DeclareModifier | ExportModifier
  enum: DeclareModifier | ExportModifier
  type: DeclareModifier | ExportModifier
}

export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: string
}

interface DecoratorNamePatternFilterCustomGroup {
  decoratorNamePattern?: string
}

export type SingleCustomGroup = (
  | (DecoratorNamePatternFilterCustomGroup &
      BaseSingleCustomGroup<ClassSelector>)
  | BaseSingleCustomGroup<InterfaceSelector>
  | BaseSingleCustomGroup<FunctionSelector>
  | BaseSingleCustomGroup<EnumSelector>
  | BaseSingleCustomGroup<TypeSelector>
) &
  ElementNamePatternFilterCustomGroup

export type CustomGroup = (
  | {
      order?: SortModulesOptions[0]['order']
      type?: SortModulesOptions[0]['type']
    }
  | {
      type?: 'unsorted'
    }
) &
  (SingleCustomGroup | AnyOfCustomGroup) & {
    groupName: string
  }

export type SortModulesOptions = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    customGroups: CustomGroup[]
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
  }>,
]

export const allSelectors: Selector[] = [
  'enum',
  'function',
  'interface',
  // 'module',
  // 'namespace',
  'type',
  'class',
]

export const allModifiers: Modifier[] = [
  'async',
  'declare',
  'decorated',
  'default',
  'export',
]

export const customGroupSortJsonSchema: Record<string, JSONSchema4> = {
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

export const customGroupNameJsonSchema: Record<string, JSONSchema4> = {
  groupName: {
    description: 'Custom group name.',
    type: 'string',
  },
}

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
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
