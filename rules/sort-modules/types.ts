import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type {
  PartitionByCommentOption,
  NewlinesBetweenOption,
  CommonOptions,
  GroupsOptions,
  TypeOption,
} from '../../types/common-options'
import type { JoinWithDash } from '../../types/join-with-dash'

import {
  buildCustomGroupModifiersJsonSchema,
  buildCustomGroupSelectorJsonSchema,
  elementNamePatternJsonSchema,
} from '../../utils/common-json-schemas'

export type SingleCustomGroup = (
  | (DecoratorNamePatternFilterCustomGroup &
      BaseSingleCustomGroup<ClassSelector>)
  | BaseSingleCustomGroup<InterfaceSelector>
  | BaseSingleCustomGroup<FunctionSelector>
  | BaseSingleCustomGroup<EnumSelector>
  | BaseSingleCustomGroup<TypeSelector>
) &
  ElementNamePatternFilterCustomGroup

export type SortModulesOptions = [
  Partial<
    {
      partitionByComment: PartitionByCommentOption
      newlinesBetween: NewlinesBetweenOption
      groups: GroupsOptions<Group>
      customGroups: CustomGroup[]
      partitionByNewLine: boolean
      type: TypeOption
    } & CommonOptions
  >,
]

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
) & {
  newlinesInside?: 'always' | 'never'
  groupName: string
} & (SingleCustomGroup | AnyOfCustomGroup)
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

type NonDefaultClassGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, DecoratedModifier, ClassSelector]
>

type DefaultFunctionGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, AsyncModifier, FunctionSelector]
>

type DefaultClassGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, DecoratedModifier, ClassSelector]
>

type NonDefaultInterfaceGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, InterfaceSelector]
>

type NonDefaultFunctionGroup = JoinWithDash<
  [ExportModifier, DeclareModifier, FunctionSelector]
>

type DefaultInterfaceGroup = JoinWithDash<
  [ExportModifier, DefaultModifier, InterfaceSelector]
>

interface DecoratorNamePatternFilterCustomGroup {
  decoratorNamePattern?: string
}

interface ElementNamePatternFilterCustomGroup {
  elementNamePattern?: string
}

type TypeGroup = JoinWithDash<[ExportModifier, DeclareModifier, TypeSelector]>

type EnumGroup = JoinWithDash<[ExportModifier, DeclareModifier, EnumSelector]>

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
