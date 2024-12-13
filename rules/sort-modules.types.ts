import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { Join } from '../typings'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../utils/common-json-schemas'

export type SortModulesOptions = [
  Partial<{
    type: 'alphabetical' | 'line-length' | 'natural' | 'custom'
    partitionByComment: string[] | boolean | string
    newlinesBetween: 'ignore' | 'always' | 'never'
    specialCharacters: 'remove' | 'trim' | 'keep'
    locales: NonNullable<Intl.LocalesArgument>
    customGroups: CustomGroup[]
    groups: (Group[] | Group)[]
    partitionByNewLine: boolean
    order: 'desc' | 'asc'
    ignoreCase: boolean
    alphabet: string
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

type CustomGroup = (
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

interface BaseSingleCustomGroup<T extends Selector> {
  modifiers?: AllowedModifiersPerSelector[T][]
  selector?: T
}

type NonDefaultClassGroup = Join<
  [ExportModifier, DeclareModifier, DecoratedModifier, ClassSelector]
>

type DefaultFunctionGroup = Join<
  [ExportModifier, DefaultModifier, AsyncModifier, FunctionSelector]
>

type DefaultClassGroup = Join<
  [ExportModifier, DefaultModifier, DecoratedModifier, ClassSelector]
>

type NonDefaultInterfaceGroup = Join<
  [ExportModifier, DeclareModifier, InterfaceSelector]
>

type NonDefaultFunctionGroup = Join<
  [ExportModifier, DeclareModifier, FunctionSelector]
>

type DefaultInterfaceGroup = Join<
  [ExportModifier, DefaultModifier, InterfaceSelector]
>

interface DecoratorNamePatternFilterCustomGroup {
  decoratorNamePattern?: string
}

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: string
}

type TypeGroup = Join<[ExportModifier, DeclareModifier, TypeSelector]>

type EnumGroup = Join<[ExportModifier, DeclareModifier, EnumSelector]>

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

/**
 * Ideally, we should generate as many schemas as there are selectors, and ensure
 * that users do not enter invalid modifiers for a given selector
 */
export let singleCustomGroupJsonSchema: Record<string, JSONSchema4> = {
  decoratorNamePattern: {
    description: 'Decorator name pattern filter.',
    type: 'string',
  },
  modifiers: buildCustomGroupModifiersJsonSchema(allModifiers),
  selector: buildCustomGroupSelectorJsonSchema(allSelectors),
  elementNamePattern: elementNamePatternJsonSchema,
}
