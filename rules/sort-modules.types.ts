import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

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
export type Selector =
  // | NamespaceSelector
  | InterfaceSelector
  | FunctionSelector
  // | ModuleSelector
  | ClassSelector
  | TypeSelector
  | EnumSelector
export type Modifier =
  | DecoratedModifier
  | DeclareModifier
  | DefaultModifier
  | ExportModifier
  | AsyncModifier
export interface AnyOfCustomGroup {
  anyOf: SingleCustomGroup[]
}

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
type NonDefaultClassGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${DecoratedModifierPrefix}${ClassSelector}`
type DefaultFunctionGroup =
  `${ExportModifierPrefix}${DefaultModifierPrefix}${AsyncModifierPrefix}${FunctionSelector}`
type DefaultClassGroup =
  `${ExportModifierPrefix}${DefaultModifierPrefix}${DecoratedModifierPrefix}${ClassSelector}`
interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type NonDefaultInterfaceGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${InterfaceSelector}`

type NonDefaultFunctionGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${FunctionSelector}`
type DefaultInterfaceGroup =
  `${ExportModifierPrefix}${DefaultModifierPrefix}${InterfaceSelector}`
type TypeGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${TypeSelector}`
type EnumGroup =
  `${ExportModifierPrefix}${DeclareModifierPrefix}${EnumSelector}`
interface DecoratorNamePatternFilterCustomGroup {
  decoratorNamePattern?: string
}

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: string
}
type DecoratedModifierPrefix = WithDashSuffixOrEmpty<DecoratedModifier>
type DeclareModifierPrefix = WithDashSuffixOrEmpty<DeclareModifier>
type DefaultModifierPrefix = WithDashSuffixOrEmpty<DefaultModifier>
type ExportModifierPrefix = WithDashSuffixOrEmpty<ExportModifier>
type AsyncModifierPrefix = WithDashSuffixOrEmpty<AsyncModifier>
type WithDashSuffixOrEmpty<T extends string> = `${T}-` | ''
type DecoratedModifier = 'decorated'

type InterfaceSelector = 'interface'

type FunctionSelector = 'function'

type DeclareModifier = 'declare'

type DefaultModifier = 'default'

type ExportModifier = 'export'

type AsyncModifier = 'async'

type ClassSelector = 'class'

type TypeSelector = 'type'

type EnumSelector = 'enum'

export let allSelectors: Selector[] = [
  'enum',
  'function',
  'interface',
  // 'module',
  // 'namespace',
  'type',
  'class',
]

export let allModifiers: Modifier[] = [
  'async',
  'declare',
  'decorated',
  'default',
  'export',
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
